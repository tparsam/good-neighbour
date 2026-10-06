# Ring Bird Journal

Turn a Ring camera into a smart bird feeder camera. The app watches the camera's
live stream, names the birds that visit, saves a snapshot of each, and keeps a
life list.

Built for the Ring track of the Build, Ship, Shape: Amazon Developer Hackathon,
with the AWS Builder and Open Source mini challenges.

## How it works

1. The browser plays the Ring live stream and samples a frame every 2 seconds.
2. Frames that have not changed are skipped.
3. Changed frames go to Amazon Bedrock (Nova Lite), which names the birds it can see.
4. A bird named on two frames in a row starts a visit. The visit ends 10 seconds
   after the bird was last seen.
5. Visits and snapshots are saved as plain files in `data/`.

The app never shows a species it is unsure of: unclear birds are recorded as
"Unidentified bird".

## Run it

You need Node.js 24 or newer, a Ring developer account and an AWS account.

    npm install
    cp .env.example .env.local

In `.env.local`, set:

- `RING_ACCESS_TOKEN`: from the Ring Developer Playground. It lasts 30 minutes.
- `AWS_BEARER_TOKEN_BEDROCK`: an Amazon Bedrock API key, US East (N. Virginia).

Then:

    npm run dev

Open http://localhost:3000 and press "Start live stream".

## Tests

    npm test

## What uses what

- Ring API: device discovery, device location, live stream (WHEP).
- Amazon Bedrock: Nova Lite through the Converse API.

## Limits

- Tested only against the Ring Developer Playground's sandbox camera.
- One camera, one user, one laptop. Nothing is hosted.
- Species names come from an AI model and can be wrong.
- At most 2,000 frames are analysed per run, as a cost stop.

## Credits

Based on [ring-api-helloworld](https://github.com/AmazonAppDev/ring-api-helloworld)
by Amazon, used under the MIT licence. The live-stream code is theirs.

The visual design is modelled on the Thyssen-Bornemisza museum's
[Return to Nature](https://www.museothyssen.org/webdocs/conectathyssen/volver-naturaleza/en/)
webdoc. Only its layout and style were followed; none of its images, text or
font files are used. See `DESIGN.md`.

## Licence

MIT. See `LICENSE`.
