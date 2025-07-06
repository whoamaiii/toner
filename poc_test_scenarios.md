# PoC Test Scenarios - TonerWeb AI Enhanced Office Products

## Test Categories

### **Category 1: Pen/Writing Supplies Tests**

#### Test 1.1: Basic Pen Query (Norwegian)
- **Query**: "Trenger en god kulepenn til kontoret"
- **Expected**: Should find BIC or similar pen products from /k/kontorprodukter/skriveredskaper
- **Success Criteria**: 
  - ✓ Identifies this as a pen query (not printer-related)
  - ✓ Searches /k/kontorprodukter/skriveredskaper
  - ✓ Returns actual tonerweb.no product URLs
  - ✓ Provides Norwegian product descriptions

#### Test 1.2: Brand-Specific Pen Query
- **Query**: "Har dere BIC penner på lager?"
- **Expected**: Should search for BIC brand pens specifically
- **Success Criteria**: 
  - ✓ Recognizes "BIC" as pen brand
  - ✓ Uses "site:tonerweb.no BIC kulepenn" search pattern
  - ✓ Returns BIC-specific products if available

#### Test 1.3: Color-Specific Pen Query
- **Query**: "Jeg trenger blå penn og rød penn"
- **Expected**: Should find colored pens
- **Success Criteria**: 
  - ✓ Understands color specifications
  - ✓ Searches for pens with color options
  - ✓ Returns multiple products if available

#### Test 1.4: Alternative Norwegian Terms
- **Query**: "Hvor kan jeg kjøpe skriveredskap?"
- **Expected**: Should recognize "skriveredskap" as writing supplies
- **Success Criteria**: 
  - ✓ Maps "skriveredskap" to writing supplies category
  - ✓ Provides broader writing supplies results

### **Category 2: Post-it/Notes Tests**

#### Test 2.1: Basic Post-it Query
- **Query**: "Trenger post-it lapper til møterommet"
- **Expected**: Should find sticky notes/post-it products
- **Success Criteria**: 
  - ✓ Recognizes "post-it" as office supply category
  - ✓ Searches using "site:tonerweb.no post-it" pattern
  - ✓ Returns actual sticky note products

#### Test 2.2: Norwegian Alternative Terms
- **Query**: "Har dere selvklebende lapper?"
- **Expected**: Should map to post-it/sticky notes
- **Success Criteria**: 
  - ✓ Understands "selvklebende lapper" = sticky notes
  - ✓ Uses alternative search terms
  - ✓ Finds equivalent products

#### Test 2.3: Size-Specific Query
- **Query**: "Store post-it ark til presentasjoner"
- **Expected**: Should find larger format sticky notes
- **Success Criteria**: 
  - ✓ Understands size specification
  - ✓ Searches for presentation-sized notes

### **Category 3: Coffee Products Tests**

#### Test 3.1: Basic Coffee Query
- **Query**: "Kaffekapseр til kontoret"
- **Expected**: Should find coffee capsules from /k/spise_drikke
- **Success Criteria**: 
  - ✓ Identifies coffee category correctly
  - ✓ Searches /k/spise_drikke/kaffe
  - ✓ Returns coffee capsule products

#### Test 3.2: Brand-Specific Coffee Query
- **Query**: "Har dere Nespresso kapsler?"
- **Expected**: Should find Nespresso-compatible capsules
- **Success Criteria**: 
  - ✓ Recognizes "Nespresso" as coffee brand
  - ✓ Uses "site:tonerweb.no Nespresso kaffekapsel" pattern
  - ✓ Returns Nespresso-specific products

#### Test 3.3: Coffee Bean Query
- **Query**: "Jeg vil kjøpe kaffebønner til kaffemaskinen"
- **Expected**: Should find coffee beans, not capsules
- **Success Criteria**: 
  - ✓ Distinguishes between beans and capsules
  - ✓ Searches for coffee beans specifically
  - ✓ Returns bean products if available

### **Category 4: Mixed Product Tests**

#### Test 4.1: Multi-Category Query
- **Query**: "Trenger penn og kaffekapseр til kontoret"
- **Expected**: Should handle both product types
- **Success Criteria**: 
  - ✓ Identifies both pen and coffee requirements
  - ✓ Provides products from both categories
  - ✓ Maintains clear separation between categories

#### Test 4.2: Printer + Office Supply Query
- **Query**: "HP toner og BIC penn til kontoret"
- **Expected**: Should handle both printer and office supplies
- **Success Criteria**: 
  - ✓ Maintains excellent printer toner search (existing functionality)
  - ✓ Also provides pen recommendations (new functionality)
  - ✓ Clearly labels each category

### **Category 5: Edge Cases & Fallbacks**

#### Test 5.1: Ambiguous Query
- **Query**: "Trenger noe å skrive med"
- **Expected**: Should suggest pen options
- **Success Criteria**: 
  - ✓ Interprets vague request correctly
  - ✓ Suggests various writing implements
  - ✓ Provides category browsing suggestions

#### Test 5.2: Product Not Available
- **Query**: "Har dere Mont Blanc penner?"
- **Expected**: Should gracefully handle unavailable premium brands
- **Success Criteria**: 
  - ✓ Searches for the specific brand
  - ✓ If not found, clearly states unavailability
  - ✓ Suggests alternative pen brands available on tonerweb.no

#### Test 5.3: Misspelled Product
- **Query**: "Jeg trenger kafekapsler" (misspelled)
- **Expected**: Should understand despite typo
- **Success Criteria**: 
  - ✓ Handles common Norwegian spelling variations
  - ✓ Still finds coffee capsule products
  - ✓ May correct the spelling in response

### **Category 6: Norwegian Language Variations**

#### Test 6.1: Formal vs Informal Language
- **Query 1**: "Ønsker å anskaffe skrivemateriell"
- **Query 2**: "Vil ha penn"
- **Expected**: Both should work despite formality difference
- **Success Criteria**: 
  - ✓ Handles both formal and casual Norwegian
  - ✓ Recognizes synonyms and language variations

#### Test 6.2: Regional Variations
- **Query**: "Trenger blekkpenner" (using "blekkpenn" instead of "kulepenn")
- **Expected**: Should understand regional terminology
- **Success Criteria**: 
  - ✓ Maps regional terms to standard products
  - ✓ Finds relevant pen products

## Expected Performance Improvements

### Before PoC (Current System)
- **Office Product Queries**: ~20% success rate
- **Pen Queries**: Usually redirected to ink cartridges (confusion)
- **Coffee Queries**: No relevant results
- **Norwegian Synonyms**: Limited coverage

### Target After PoC
- **Office Product Queries**: ~70% success rate
- **Pen Queries**: Proper office supply results
- **Coffee Queries**: Relevant coffee product results  
- **Norwegian Synonyms**: Comprehensive coverage

## Success Metrics

### Primary Metrics
- [ ] **Category Recognition**: 90%+ of queries correctly identified
- [ ] **URL Accuracy**: 95%+ of returned URLs are valid tonerweb.no product pages
- [ ] **Norwegian Language**: 90%+ understanding of Norwegian terms and synonyms
- [ ] **No Regression**: 100% of existing printer functionality preserved

### Secondary Metrics
- [ ] **Response Quality**: Products match user intent
- [ ] **Fallback Behavior**: Graceful handling of unavailable products
- [ ] **Cross-Category**: Mixed queries handled appropriately

## Test Execution Plan

### Phase 1: Manual Testing (Day 1)
- [ ] Execute all Category 1-3 tests manually
- [ ] Document response quality and URL accuracy
- [ ] Identify any immediate issues

### Phase 2: Edge Case Testing (Day 2)
- [ ] Execute Category 4-6 tests
- [ ] Test boundary conditions and error cases
- [ ] Validate fallback mechanisms

### Phase 3: Performance Testing (Day 3)
- [ ] Measure response times
- [ ] Test with high query volumes
- [ ] Validate system stability

### Phase 4: Comparison Testing (Day 3)
- [ ] Run same queries on old vs new system
- [ ] Document improvement metrics
- [ ] Prepare demo scenarios

## Demo Script

### Opening (Current Limitations)
1. **Show Current Problem**: "Trenger en god penn til kontoret"
   - Current system: Gets confused, suggests ink cartridges
   - Highlight the mismatch between user intent and results

### Implementation (PoC Solution)
2. **Show Enhanced System**: Same query with new prompts
   - Enhanced system: Correctly identifies office supplies need
   - Returns actual pen products from tonerweb.no with real URLs
   - Demonstrates proper Norwegian language understanding

### Impact (Expanded Coverage)
3. **Show Broader Coverage**: 
   - Coffee query: "Nespresso kaffekapseр"
   - Post-it query: "Selvklebende lapper"
   - Mixed query: "Penn og kaffe til kontoret"

### Results Summary
4. **Show Metrics**:
   - X% improvement in non-printer query success
   - Expanded coverage from 1 to 4 major categories
   - Maintained 100% existing printer functionality

This comprehensive test suite validates that the PoC successfully expands TonerWeb AI coverage while maintaining quality and reliability.