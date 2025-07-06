/**
 * Image validation system for the TonerWeb AI Assistant.
 * 
 * This module provides comprehensive image validation and processing with:
 * - Safe base64 image validation and parsing
 * - Image format and size validation
 * - Image optimization and processing
 * - Security checks for malicious images
 * - Graceful error handling with user-friendly messages
 * 
 * @author TonerWeb Team
 * @version 1.0.0
 */

import sharp from 'sharp';
import { ImageValidationError, ProcessingError } from '../errors/types';
import { configManager } from '../config/manager';
import { logger } from '../logging/logger';

/**
 * Configuration options for image validation.
 */
export interface ImageValidationOptions {
  // Size Constraints
  maxSizeBytes?: number;
  maxWidth?: number;
  maxHeight?: number;
  minWidth?: number;
  minHeight?: number;
  
  // Format Options
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  
  // Processing Options
  enableOptimization?: boolean;
  optimizationQuality?: number;
  optimizationMaxDimension?: number;
  
  // Security Options
  enableSecurityChecks?: boolean;
  maxPixelDensity?: number;
}

/**
 * Result of image validation and processing.
 */
export interface ImageValidationResult {
  // Original Image Data
  originalBuffer: Buffer;
  originalMimeType: string;
  originalMetadata: sharp.Metadata;
  
  // Processed Image Data
  processedBuffer?: Buffer;
  processedMimeType?: string;
  processedMetadata?: sharp.Metadata;
  
  // Validation Results
  isValid: boolean;
  validationErrors: string[];
  
  // Image Information
  fileSize: number;
  dimensions: { width: number; height: number };
  format: string;
  hasAlpha: boolean;
  colorSpace: string;
  
  // Processing Information
  wasOptimized: boolean;
  optimizationRatio?: number;
}

/**
 * Comprehensive image validator class.
 * 
 * This class provides safe image validation and processing with:
 * - Robust error handling
 * - Security checks
 * - Performance optimization
 * - Detailed validation reporting
 */
export class ImageValidator {
  private readonly defaultOptions: ImageValidationOptions;

  constructor() {
    // Get image configuration from config manager
    const imageConfig = configManager.getServiceConfig('images') || {};
    
    this.defaultOptions = {
      // Size constraints
      maxSizeBytes: imageConfig.maxSize || 10 * 1024 * 1024, // 10MB
      maxWidth: imageConfig.maxWidth || 4096,
      maxHeight: imageConfig.maxHeight || 4096,
      minWidth: imageConfig.minWidth || 32,
      minHeight: imageConfig.minHeight || 32,
      
      // Format options
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/bmp',
        'image/tiff'
      ],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff'],
      
      // Processing options
      enableOptimization: true,
      optimizationQuality: 85,
      optimizationMaxDimension: 1024,
      
      // Security options
      enableSecurityChecks: true,
      maxPixelDensity: 300, // DPI
    };
  }

  /**
   * Validates a base64 encoded image.
   * 
   * @param {string} base64Data - Base64 encoded image with data URL prefix
   * @param {ImageValidationOptions} options - Validation options
   * @returns {Promise<ImageValidationResult>} Validation result
   */
  async validateBase64Image(
    base64Data: string,
    options: ImageValidationOptions = {}
  ): Promise<ImageValidationResult> {
    const opts = { ...this.defaultOptions, ...options };
    const validationErrors: string[] = [];
    
    logger.debug('Starting image validation', { 
      dataLength: base64Data.length,
      hasOptions: Object.keys(options).length > 0 
    });

    try {
      // Step 1: Parse and validate base64 format
      const { mimeType, buffer } = this.parseBase64Image(base64Data);
      
      // Step 2: Validate MIME type
      if (!opts.allowedMimeTypes!.includes(mimeType)) {
        validationErrors.push(`Unsupported image format: ${mimeType}`);
        throw new ImageValidationError(
          `Unsupported MIME type: ${mimeType}`,
          `Please upload an image in one of these formats: ${opts.allowedMimeTypes!.join(', ')}`
        );
      }

      // Step 3: Validate file size
      if (buffer.length > opts.maxSizeBytes!) {
        const sizeMB = Math.round(buffer.length / 1024 / 1024 * 100) / 100;
        const maxSizeMB = Math.round(opts.maxSizeBytes! / 1024 / 1024);
        validationErrors.push(`File too large: ${sizeMB}MB exceeds ${maxSizeMB}MB limit`);
        throw new ImageValidationError(
          `File too large: ${buffer.length} bytes`,
          `Please upload an image smaller than ${maxSizeMB}MB. Your image is ${sizeMB}MB.`
        );
      }

      // Step 4: Parse image with Sharp and get metadata
      let sharpImage: sharp.Sharp;
      let metadata: sharp.Metadata;
      
      try {
        sharpImage = sharp(buffer);
        metadata = await sharpImage.metadata();
      } catch (error) {
                 logger.warn('Sharp failed to parse image', { error: error instanceof Error ? error.message : String(error), bufferLength: buffer.length });
        validationErrors.push('Invalid or corrupted image file');
        throw new ImageValidationError(
          `Sharp parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          'The uploaded file appears to be corrupted or is not a valid image. Please try a different image.'
        );
      }

      // Step 5: Validate image dimensions
      this.validateDimensions(metadata, opts, validationErrors);
      
      // Step 6: Security checks
      if (opts.enableSecurityChecks) {
        this.performSecurityChecks(metadata, opts, validationErrors);
      }

      // If we have validation errors, throw them
      if (validationErrors.length > 0) {
        throw new ImageValidationError(
          `Image validation failed: ${validationErrors.join(', ')}`,
          `Image validation failed: ${validationErrors[0]}`
        );
      }

      // Step 7: Create base result
      const result: ImageValidationResult = {
        originalBuffer: buffer,
        originalMimeType: mimeType,
        originalMetadata: metadata,
        isValid: true,
        validationErrors: [],
        fileSize: buffer.length,
        dimensions: {
          width: metadata.width || 0,
          height: metadata.height || 0
        },
        format: metadata.format || 'unknown',
        hasAlpha: metadata.hasAlpha || false,
        colorSpace: metadata.space || 'unknown',
        wasOptimized: false,
      };

      // Step 8: Optimize image if requested
      if (opts.enableOptimization) {
        try {
          const optimized = await this.optimizeImage(sharpImage, metadata, opts);
          result.processedBuffer = optimized.buffer;
          result.processedMimeType = optimized.mimeType;
          result.processedMetadata = optimized.metadata;
          result.wasOptimized = true;
          result.optimizationRatio = buffer.length / optimized.buffer.length;
          
          logger.debug('Image optimization completed', {
            originalSize: buffer.length,
            optimizedSize: optimized.buffer.length,
            ratio: result.optimizationRatio
          });
        } catch (error) {
                     logger.warn('Image optimization failed, using original', { error: error instanceof Error ? error.message : String(error) });
          // Don't fail validation if optimization fails
        }
      }

      logger.info('Image validation successful', {
        originalSize: buffer.length,
        dimensions: result.dimensions,
        format: result.format,
        wasOptimized: result.wasOptimized
      });

      return result;

    } catch (error) {
             logger.error('Image validation failed', error instanceof Error ? error : undefined, {
         dataLength: base64Data.length,
         validationErrors,
         errorMessage: error instanceof Error ? error.message : String(error)
       });
      
      if (error instanceof ImageValidationError) {
        throw error;
      }
      
      throw new ImageValidationError(
        `Image validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'The uploaded image could not be processed. Please try a different image.'
      );
    }
  }

  /**
   * Validates and optimizes an image in one step.
   * 
   * @param {string} base64Data - Base64 encoded image
   * @param {ImageValidationOptions} options - Validation options
   * @returns {Promise<{ buffer: Buffer; mimeType: string; metadata: sharp.Metadata }>} Processed image
   */
  async validateAndOptimizeImage(
    base64Data: string,
    options: ImageValidationOptions = {}
  ): Promise<{ buffer: Buffer; mimeType: string; metadata: sharp.Metadata }> {
    const opts = { ...options, enableOptimization: true };
    const result = await this.validateBase64Image(base64Data, opts);
    
    if (result.processedBuffer && result.processedMimeType && result.processedMetadata) {
      return {
        buffer: result.processedBuffer,
        mimeType: result.processedMimeType,
        metadata: result.processedMetadata
      };
    } else {
      return {
        buffer: result.originalBuffer,
        mimeType: result.originalMimeType,
        metadata: result.originalMetadata
      };
    }
  }

  /**
   * Parses base64 image data and extracts buffer and MIME type.
   * 
   * @private
   * @param {string} base64Data - Base64 encoded image data
   * @returns {{ mimeType: string; buffer: Buffer }} Parsed image data
   */
  private parseBase64Image(base64Data: string): { mimeType: string; buffer: Buffer } {
    try {
      // Match data URL format: data:image/jpeg;base64,/9j/4AAQ...
      const base64Match = base64Data.match(/^data:([^;]+);base64,(.+)$/);
      
      if (!base64Match) {
        throw new ImageValidationError(
          'Invalid base64 format - missing data URL prefix',
          'Please upload a valid image file. The image data appears to be in the wrong format.'
        );
      }

      const [, mimeType, base64String] = base64Match;
      
      // Validate MIME type format
      if (!mimeType || !mimeType.startsWith('image/')) {
        throw new ImageValidationError(
          `Invalid MIME type: ${mimeType}`,
          'Please upload a valid image file.'
        );
      }

      // Parse base64 string
      let buffer: Buffer;
      try {
        buffer = Buffer.from(base64String, 'base64');
      } catch (error) {
        throw new ImageValidationError(
          'Invalid base64 encoding',
          'The image data is corrupted. Please try uploading the image again.'
        );
      }

      // Validate buffer is not empty
      if (buffer.length === 0) {
        throw new ImageValidationError(
          'Empty image buffer',
          'The uploaded image appears to be empty. Please try a different image.'
        );
      }

      return { mimeType, buffer };
    } catch (error) {
      if (error instanceof ImageValidationError) {
        throw error;
      }
      
      throw new ImageValidationError(
        `Base64 parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'The image data could not be processed. Please try uploading the image again.'
      );
    }
  }

  /**
   * Validates image dimensions against constraints.
   * 
   * @private
   * @param {sharp.Metadata} metadata - Image metadata
   * @param {ImageValidationOptions} options - Validation options
   * @param {string[]} validationErrors - Array to collect validation errors
   */
  private validateDimensions(
    metadata: sharp.Metadata,
    options: ImageValidationOptions,
    validationErrors: string[]
  ): void {
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (width === 0 || height === 0) {
      validationErrors.push('Could not determine image dimensions');
      return;
    }

    // Check maximum dimensions
    if (width > options.maxWidth! || height > options.maxHeight!) {
      validationErrors.push(
        `Image too large: ${width}x${height} exceeds maximum ${options.maxWidth}x${options.maxHeight}`
      );
    }

    // Check minimum dimensions
    if (width < options.minWidth! || height < options.minHeight!) {
      validationErrors.push(
        `Image too small: ${width}x${height} below minimum ${options.minWidth}x${options.minHeight}`
      );
    }
  }

  /**
   * Performs security checks on the image.
   * 
   * @private
   * @param {sharp.Metadata} metadata - Image metadata
   * @param {ImageValidationOptions} options - Validation options
   * @param {string[]} validationErrors - Array to collect validation errors
   */
  private performSecurityChecks(
    metadata: sharp.Metadata,
    options: ImageValidationOptions,
    validationErrors: string[]
  ): void {
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    // Check for extremely high pixel density (potential DoS)
    const totalPixels = width * height;
    const maxPixels = 50 * 1024 * 1024; // 50 megapixels
    
    if (totalPixels > maxPixels) {
      validationErrors.push(`Image has too many pixels: ${totalPixels} exceeds ${maxPixels}`);
    }

    // Check for suspicious aspect ratios
    if (width > 0 && height > 0) {
      const aspectRatio = Math.max(width / height, height / width);
      if (aspectRatio > 20) {
        validationErrors.push(`Suspicious aspect ratio: ${aspectRatio.toFixed(2)}`);
      }
    }

    // Check for suspicious metadata
    if (metadata.exif && Buffer.isBuffer(metadata.exif) && metadata.exif.length > 64 * 1024) {
      validationErrors.push('Image contains excessive metadata');
    }
  }

  /**
   * Optimizes an image for processing and storage.
   * 
   * @private
   * @param {sharp.Sharp} sharpImage - Sharp image instance
   * @param {sharp.Metadata} metadata - Original image metadata
   * @param {ImageValidationOptions} options - Optimization options
   * @returns {Promise<{ buffer: Buffer; mimeType: string; metadata: sharp.Metadata }>} Optimized image
   */
  private async optimizeImage(
    sharpImage: sharp.Sharp,
    metadata: sharp.Metadata,
    options: ImageValidationOptions
  ): Promise<{ buffer: Buffer; mimeType: string; metadata: sharp.Metadata }> {
    try {
      const width = metadata.width || 0;
      const height = metadata.height || 0;
      const maxDimension = options.optimizationMaxDimension || 1024;
      
      let optimizedImage = sharpImage.clone();

      // Resize if image is too large
      if (width > maxDimension || height > maxDimension) {
        optimizedImage = optimizedImage.resize(maxDimension, maxDimension, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Convert to JPEG with quality compression for optimal size
      const buffer = await optimizedImage
        .jpeg({ 
          quality: options.optimizationQuality || 85,
          progressive: true,
          mozjpeg: true 
        })
        .toBuffer();

      // Get metadata of optimized image
      const optimizedMetadata = await sharp(buffer).metadata();

      return {
        buffer,
        mimeType: 'image/jpeg',
        metadata: optimizedMetadata
      };
    } catch (error) {
      throw new ProcessingError(
        'image_optimization',
        error instanceof Error ? error.message : 'Unknown error',
        'Failed to optimize image for processing'
      );
    }
  }

  /**
   * Checks if an image format is supported.
   * 
   * @param {string} mimeType - MIME type to check
   * @returns {boolean} True if supported, false otherwise
   */
  isFormatSupported(mimeType: string): boolean {
    return this.defaultOptions.allowedMimeTypes!.includes(mimeType);
  }

  /**
   * Gets the maximum allowed file size.
   * 
   * @returns {number} Maximum file size in bytes
   */
  getMaxFileSize(): number {
    return this.defaultOptions.maxSizeBytes!;
  }

  /**
   * Gets the maximum allowed dimensions.
   * 
   * @returns {{ width: number; height: number }} Maximum dimensions
   */
  getMaxDimensions(): { width: number; height: number } {
    return {
      width: this.defaultOptions.maxWidth!,
      height: this.defaultOptions.maxHeight!
    };
  }

  /**
   * Gets supported image formats.
   * 
   * @returns {string[]} Array of supported MIME types
   */
  getSupportedFormats(): string[] {
    return [...this.defaultOptions.allowedMimeTypes!];
  }
}

/**
 * Singleton instance of the image validator.
 * 
 * This is the main image validator used throughout the application.
 * It provides consistent image validation with the configured options.
 * 
 * @example
 * import { imageValidator } from '@/shared/validation/image-validator';
 * 
 * const result = await imageValidator.validateBase64Image(base64Data);
 * if (result.isValid) {
 *   // Process the validated image
 * }
 */
export const imageValidator = new ImageValidator();