# WorkforceFit AI — Fixed Working Flow

## What was fixed

1. Mobile registration now posts to the correct backend route: `/api/candidates/register`.
2. Mobile interview now fetches questions from backend/admin question bank.
3. Admin can create Kannada/Hindi/English interview questions with expected keywords.
4. Scoring is no longer random. It checks response length, expected keywords, clarity and confidence indicators.
5. Completed mobile interviews are visible in the admin dashboard with candidate score, fitment, face/voice score and answer summary.

## Run backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Open API docs:

```text
http://localhost:8000/docs
```

## Run admin dashboard

```powershell
cd admin-app
npm install
npm start
```

Admin opens at:

```text
http://localhost:3000
```

## Run mobile app

```powershell
cd mobile
npm install
npx expo start
```

Important: in `mobile/screens/Interview.js` and `mobile/screens/Registration.js`, replace `192.168.1.4` with your actual PC IPv4 address.

Find IPv4 in PowerShell:

```powershell
ipconfig
```

Use the Wi-Fi IPv4 address, for example:

```js
const API_BASE = "http://192.168.1.8:8000";
```

## Demo flow

1. Start backend.
2. Start admin app.
3. In admin, go to **Question Builder** and add Kannada questions.
4. Start mobile app.
5. Register candidate.
6. Candidate attends interview.
7. Submit answers.
8. Admin dashboard refreshes and shows score, fitment category and answer summary.

## Fitment logic

- 78+ = Job Ready
- 58–77 = Requires Upskilling
- 42–57 = Manual Verification
- Below 42 = Low Confidence
- Duplicate / failed liveness = Suspected Duplicate/Fraud
