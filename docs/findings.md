# Findings from the live Playground

Checked on 2026-10-06 through the Ring Developer Playground page itself, before
the app existed. Sections marked "not yet checked" need the app running with a
live token.

## Which clip the app's own stream shows

Not yet checked.

In the Playground, the three "Simulate live view event" buttons each open a live
stream of stock footage: Motion shows birds at snowy feeders, Package shows a
porch with a parcel, Vehicle shows a driveway. The request the Playground
displays is the same for all three (a POST to the device's WHEP sessions
endpoint), so how the clip is chosen is not visible from the page.

## How long a stream lasts, and whether it loops

Not yet checked. After closing a stream, the Playground showed "Event is still
streaming. You can select a new event in 17s", so a stream runs for at least
some tens of seconds.

## Does pressing Motion in the Playground change what the app's stream shows

Not yet checked.

## Device location response

Not yet checked.
