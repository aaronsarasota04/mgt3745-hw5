# Architecture

Status: ACTIVE in Module 3.

## Gate

| Criterion | Weight | Hand-built option | Existing-service option | AI-assisted build |
|---|---:|---:|---:|---:|
| Cost to start |2 |1 |2 |4 |
| Cost to maintain |4 |3 |3 |4 |
| Time to working |4 |3 |1 |4 |
| Inspectability |5 |3 |3 |4 |
| Switching cost |2 |3 |3 |4 |
| Fit to spec |4 |3 |1 |5 |
| **Weighted total** | | **59** | **45** | **88** |

## ADR-001

Title and date: Browser-based job-fit calculator built with AI assistance, 2026-09-13
Status: Superseded by ADR-002

Door: Delegate. We choose the AI-assisted build option for implementation rather than purchasing an existing service. AI assistance accelerates development, while we retain ownership and operation of the browser-based app.

Context: Feature 2 is a performance-class need: the product should help a student decide whether a role is worth pursuing when the posted requirements are only a partial match. The workflow should be transparent and user-controlled: the user supplies their résumé or qualifications, the job description lists required technologies and skills, and the app calculates how many requirements are covered. This keeps the decision grounded in evidence the user can inspect while still using AI assistance to accelerate implementation and improve clarity of the fit analysis.

Decision: We choose Delegate, represented by the AI-assisted build column. Its weighted total of 88 is higher than hand-built at 59 and existing service at 45. The advantage comes from the scores for cost to start, cost to maintain, time to working, inspectability, switching cost, and fit to spec, using the 1/3/5 anchors consistently: 1 = least favorable, 3 = moderate, 5 = most favorable. We will build a browser-based app that compares user-entered skills or résumé evidence against job requirements and shows a percentage match, missing requirements, and a simple fit summary. AI assists implementation; the app itself remains a deterministic browser-based calculator that we own and operate.

Consequences: The chosen architecture keeps the feature fast, easy to inspect, and easy to test in a browser environment while avoiding backend cost, external dependencies, and unnecessary complexity. It supports a transparent comparison workflow in which the user can see the role requirements, their own skill list, and the resulting percentage without needing a database or a paid service. The tradeoff is that it does not yet weight individual job skills by business importance, so a role with a few critical requirements may still look more favorable than it truly is. This also means it does not support multi-user persistence, richer recruiter data, or advanced analytics beyond a local prototype. It does not guarantee interviews or offers; it only helps the user decide whether a role is worth pursuing. Revisit this ADR when the product needs weighted skill importance, shared storage, or a backend-driven matching model.

## Gate(Backend)

| Criterion | Weight | Hand-built option | Existing-service option | AI-assisted build |
|---|---:|---:|---:|---:|
| Cost to start |2 |2 |4 |3 |
| Cost to maintain |4 |2 |5 |2 |
| Time to working |4 |3 |1 |2 |
| Inspectability |5 |5 |4 |5 |
| Switching cost |2 |5 |3 |4 |
| Fit to spec |4 |5 |3 |5 |
| **Weighted total** | | **79** | **70** | **75** |

## ADR-002

Title and date: Backend to store user input, 2026-09-21
Status: Accepted

Door: Build.

Context: This feature is important to ensure user-entered skills and job skills survive a cleared cache and to prevent accidental loss of data input to the app. When the user evaluates a match, the browser sends a JSON snapshot containing the entered skills and job requirements to this project's Cloudflare Worker, which stores the snapshot in Cloudflare D1. The crossing is to Cloudflare under Cloudflare's applicable Terms of Service and D1 service terms; the developer who created the app is accountable for the app's data handling, request validation, and configuration, while Cloudflare is accountable for operating the Worker and D1 services under those terms.

Decision: We choose Build, represented by the hand-built option, to store user input with Cloudflare Worker and D1. Its weighted total of 79 is higher than the existing-service option at 70 and the AI-assisted build option at 75. The switching-cost score reflects the experience of moving the data to a Worker and D1 once during this assignment. AI assisted implementation, but I retained responsibility for inspecting and verifying the Worker, its bind() usage, its 400 validation path, and its connection to the page. The 1/3/5 anchors were used consistently: 1 = least favorable, 3 = moderate, 5 = most favorable.

Consequences: Testing is harder because it must cover the browser, the data transfer from the browser to the Worker, request validation, failed network requests, and the D1 binding rather than only the local calculator. The shared table may contain a stranger's skills or other sensitive information, creating security and privacy risks if unauthorized users can access it or if the data is retained too long. Cloudflare usage and storage costs also make a predictable cost ceiling harder to guarantee, so request limits, retention rules, and usage monitoring are needed to control expenses. Revisit this ADR if these risks require stronger access controls, offline-first persistence, retention controls, or a predictable cost ceiling.
