# Fact-check of launch data and story copy (11 Nov 2026)

Every figure in `public/data/*.csv` was read against its cited source page, and every number in the launch beats (B01–B15) of the story timeline was checked against the data. Story beats B16+ are post-launch and were skipped.

## Fixed in this PR

| Row | Was | Now | Why |
| --- | --- | --- | --- |
| `race_years` Bromo | 2025: 1,602 starters, "2,167 registered" | **2014**: 1,602, 40 countries | The cited ANTARA photo is dated 8 Sep 2014 (second edition). The 2,167 figure is not on the page. Bromo now has no 2025 count. |
| `race_years` JAKIM 2026 | 42K = 8,000 | 42K = 8,200 | Katadata and Fortune both say 8,200; one caption says 8,600. Source for 45,500 and Rp225 bn moved to Infobank, which is where those numbers appear. |
| `race_years` JAKIM 2025 note | three impact figures, two without links | four figures, all linked | Rp122 bn (BTN CEO, Fortune), Rp125 bn (Governor, Kontan), Rp127.1 bn (IMRR, Industry), ~Rp155 bn (Infobank). |
| `race_years` JRF 2026 | `total` | `total_min` | Source says "more than 37,000". |
| `race_years` JRF 2025 | `total` | `approx` | 27,300 is BNI's pre-race figure; Katadata says about 27,000. |
| `race_years` Borobudur 2022 | `quota` | `target` | Source quotes the governor's 5,000 target (4,617 registered). |
| `race_years` Borobudur 2025 | note "38–39 countries; Rp72–74 bn estimated before" | 39 countries | Source says 39; the Rp72–74 bn estimate is not in it. |
| `race_years` Borobudur 2019 | note | says Rp29 bn was a pre-race forecast | Source: "dipastikan bakal melampaui". |
| `origins` Borobudur 2025 countries | 38 | 39 | As above. |
| `origins` Maybank 2025 countries | Investortrust link | Jawapos link | 52 countries is not in the Investortrust article; Jawapos headline has it. |
| `origins` new rows | | Bromo 2014: 40 countries; JAKIM 2026: 52 countries | From the cited sources. |

## Checked and matching (no change)

Maybank 2012, 2013, 2017, 2018, 2025, 2026 (incl. 4,279 "Marathon" and 46 countries); JRF 2013–2016, 2018 (12,000 body / 12,500 captions, noted), 2019, 2022, 2024, JRF 2025 impact Rp160 bn; Bromo 2013, 2017, 2024; Pocari Bandung 2024, 2025, 2026 (Rp89.4 bn direct, West Java, mayor's figure); Pocari Bandung 47% from Jabodetabek (2025); Borobudur 2017, 2023, 2026 quota; Jogja 2017, 2018, 2022, 2023; CitraLand 2022–2026; JAKIM 2023, 2024, 2025 (31,000, 4,000 in 42K, Rp127.1 bn); Pocari Lombok 2025 (9,000+, 70% outside NTB, Rp100 bn); Bekasi 2024; ISOPLUS 2025, 2026; event counts 2019 (floor), 2024, 2025.

## Could not verify (site blocked or down)

- Borobudur 2018 (jatengprov.go.id ?p=34929 shows a bot check).
- Jogja 2025 (9,200) and 2026 (10,200, 17 countries): Rmol, Bisnis and Infobank failed to load; the figures match the article headlines.
- Maybank 2026 Rp300 bn target (Bisnis failed).
- Pocari Lombok 2026 quota 10,000 (Investortrust failed). The Rp95 bn source names no estimator and its participant line is garbled ("200 runners from 325 cities").
- Pocari Bandung 2014 (5,150) and the 2015–2023 series: Kompas blocks automated reading.
- Bromo first edition source (beritajatim) failed; Runsociety confirms 2013.

## Story copy (launch beats)

| Beat | Claim | Status |
| --- | --- | --- |
| B01, B02 | 45,500; 31,000 → 82,500; 2.7× | Matches data (82,500 / 31,000 = 2.66). |
| B04 | JAKIM tripled; Maybank +4%; Jogja +11% | Matches (3.03×, +4.3%, +10.9%). |
| B04 | Borobudur 17,029 entries for 8,000 places, 2019 ballot | Sourced (jatengprov ?p=49850), but 17,029 was the count on 31 May 2019, so say "more than 17,000". |
| B05 | 31,000 / 4,000; 16,023 + 30,435 virtual | Matches. |
| B06 | 1999 race had 147 runners; 2,000+ in 2012 | Sourced (Wikipedia "Bali Marathon"; Tempo). 1999 race had a half marathon and 10K. |
| B07 | 7 of 11 races began 2017 or later; JAKIM 2023, 12,000 | Matches `races.csv`. |
| B09 | Maybank first to Elite | **Unsourced.** Borobudur Elite 2025 (ANTARA), JAKIM Basic 2025 (GoodStats) → Elite 2026 (Kontan) are sourced. |
| B10 | Range Rp170.8 bn (Maybank) to Rp67 bn (Borobudur) | Matches, excluding targets and projections. |
| B11 | "One race, three numbers": Rp122, Rp127.1, ~Rp155 bn | **Four** figures exist: the Governor also said Rp125 bn (Kontan). |
| B12 | 70% Lombok; 47% Bandung; 1,012 international; Maybank 46 countries | Matches. |
| B13 | Rp170.8 bn direct, Rp225.5 bn indirect | Matches. |
| B14 | Twelve races; pins sized by 2025 runners | Bromo now has no 2025 count, so it shows as an outlined pin. |
| B18a (post-launch) | Bandung had a 42K until 2024 | **Not confirmed.** 2024 reports mention only 10K and half marathon in Bandung. Recheck before that beat ships. |

## Open for a later pass

- Bekasi 2023 ≈ 1,700 can be derived from the Esa Unggul paper ("2,200, up 500 from 2023").
- JAKIM 2025 countries: 51 (Katadata) vs 53 (IMRR).
