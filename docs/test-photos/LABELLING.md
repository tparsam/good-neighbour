# How the benchmark photos were labelled

Each photo in `labels.json` lists the areas a perfect answer would mark, as
boxes `[x1, y1, x2, y2]` from 0 to 1, origin top-left. They were drawn by hand
on 2026-10-17 over a 10 x 10 grid, so each edge is accurate to about 0.05.
One person drew them all, so they carry that person's judgement.

## Rules

1. **Point of view.** The camera stands where the photographer stood, on the
   owner's own home.
2. **neighbour:** every clearly visible home that is not the owner's. A row
   of attached houses is one area. Homes smaller than about 1% of the picture
   are left out.
3. **road:** the street and its pavement, as one band.
4. **vehicle:** each group of vehicles parked or moving together is one area.
5. **Not marked:** the owner's own foreground (garden, path, porch), people,
   trees, sky, and anything whose owner is unclear.
6. **Nothing to find** (`"areas": []`): scenes where nothing visible belongs
   to someone else, such as a back garden, a front door or flowers. Any mark on
   these counts as a false alarm.

## Photos left out

Of 150 downloaded candidates, 61 were left out: interiors, night shots,
paintings, postcards, aerial views, trains, shops and public buildings, near
duplicates, photos where it was unclear whose house was shown, and
garden-party photos with recognisable people.

## How a mark is scored

`lib/privacy/score.ts`: a mark finds an expected area if it is the same kind
and either covers at least 30% of the area or is centred inside it. Ranges
are 95% Wilson score intervals. The range for "areas found" treats areas as
independent, though several come from the same photo, so it is a little
narrower than it should be; the per-photo figures do not have this problem.
