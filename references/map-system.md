# Geographic map contract

Use the bundled Natural Earth country outlines. Do not generate a new drawing per trip.

- World overview: show only countries present in the route; label country names, never airports, cities or attractions. Display it when at least two countries are known. Flight endpoint `countryCode` includes departure/transit countries.
- Country / region overview: show the country outline and only visited cities or destination regions. Never include sightseeing POIs, restaurants, hotels, stations or airports as overview pins. They remain in itinerary events and navigation links.
- Supply `days[].countryCode`, verified city `coordinates`, and `city`. For multiple cities that day supply `mapCities: [{name,countryCode,latitude,longitude}]`. Alternatively explicitly classify city route entries with `kind: "city"`. Legacy unclassified route points are never automatically promoted to cities.
- Repeated stays in one city produce one pin. Deduplicate by country and city name, preserving route order. Distinct countries with the same city name remain separate.
- Fit the country's main outline and substantial islands plus islands containing visited cities. Keep the viewport fixed across dates for the same country. Highlight current cities; do not zoom or rebuild projection when changing dates.
- Use deterministic label placement and leader lines. Full city names always remain in the caption if labels cannot fit. Never solve density by reverting to attraction-level maps.
- Countries are explicit ISO alpha-2 codes where available. Verified city coordinates can resolve country membership using bundled boundaries. A single destination country is a fallback for days, not evidence about an unknown flight origin.
- Missing city coordinates remain pending; never use a nearby POI coordinate as the city center. Use geographical sources during normalization, not name guessing in the browser.
- Bundled Natural Earth outlines are public-domain schematic geography, not navigation or legal boundary evidence. Very small countries absent at 1:110m need a verified supplemental outline before claiming complete coverage.
