# Gemini API Integration Comparison

This compares the Gemini-backed role-suggestion integration in the AI Studio files with the Bolt implementation at commit `e3f44e6d21f6a7d36a8938fe972a9ab4267a53a8` (`index.html`, `styles.css`, `app.js`). It covers only the Gemini role-suggestion path, not the overall applications or a ranking of the tools.

## Where They Agreed

Both clients POST to the Worker's `/job-suggestions` endpoint with the user's skill text and current job text, keeping the Gemini call and credential behind the server. Both render role names, explanations, and optional skills to build using `textContent`, and present the results as ideas for further research rather than verified openings or employment predictions.

## Where They Differed

- **Input validation:** `app.js` checks whether the trimmed skill text is empty before requesting suggestions. `aisapp.js` runs the text through `extractSkills` first, so separators-only input is rejected before the request.
- **Response validation:** AI Studio's app.js requires a nonempty `suggestions` array and string `role` and `explanation` fields before rendering. Bolt.New `app.js` passes the returned array to the renderer without checking that shape first.
- **Failure handling:** The commit's request helper returns HTTP status and response text, allowing the UI to distinguish connection errors, validation failures, and other server failures. AIS throws on a non-OK response and displays a generic failure message. The commit also disables the request button while waiting; AIS leaves it enabled.
- **Draft preservation:** AI Studio saves the current form values before requesting suggestions and restores them if the request or response handling fails. The commit's suggestion flow does not save a draft when the request is made, though it leaves the current fields untouched.
- **Presentation of results:** The commit starts with an empty, hidden suggestion list in its own section and reveals it after a successful request. The AI studio version starts with sample role cards visible in the page; a successful request replaces them, while a failure hides the suggestion panel.

## Prediction Boundary

The recorded Loose prediction concerns adherence to `STYLE.md` tokens, not Gemini integration; its separate resolution does not provide evidence about this API comparison.

## What the Agreement Says About the Spec

Both implementations route Gemini requests through the Worker and frame suggestions as exploratory, which indicates the spec communicates the security boundary and intended use while leaving response validation and failure-feedback detail open.