---
name: Orientation debugging
description: Verification limits and source-of-truth choice for the rotate-phone prompt.
---

Base prompt visibility on page layout, not a claim that a particular screen-orientation API is always accurate.

**Why:** An earlier screen-orientation-first change was described as a confirmed iPhone fix without device validation; the user reported it still failed. Physical rotation, OS rotation lock, and browser viewport orientation are distinct.

**How to apply:** Test conflicting screen/viewport signals and delayed layout updates. Describe emulated browser checks as emulation, not physical iPhone verification. Do not infer that rotation lock is enabled when the user declines to check it.