/** A line drawing of a view from a front door: the owner's porch, lawn and driveway in the
 *  foreground, then the pavement and road with a parked car, and a neighbour's house across
 *  the road. It is a stand-in for a real camera frame and is labelled as a sample on the page. */
export function SampleScene() {
  return (
    <svg
      className="scene"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Sample scene: a driveway and lawn in front, a road with a parked car, and a neighbour's house across the road"
    >
      {/* Neighbour's house across the road */}
      <path d="M950 430V170h550v260" />
      <path d="M920 170l305-110 305 110" />
      <rect x="1180" y="300" width="80" height="130" />
      <rect x="1010" y="220" width="100" height="80" />
      <path d="M1060 220v80M1010 260h100" />
      <rect x="1340" y="220" width="100" height="80" />
      <path d="M1390 220v80M1340 260h100" />

      {/* A tree on the far side */}
      <path d="M150 430V330" />
      <circle cx="150" cy="255" r="78" />

      {/* Road, with its centre line, and the pavement nearer the camera */}
      <path d="M0 430h1600M0 560h1600M0 600h1600" />
      <path d="M0 495h1600" strokeDasharray="60 44" />

      {/* A car parked on the road */}
      <path d="M250 540v-52c0-10 8-18 18-18h36l34-30h150l44 30h20c10 0 18 8 18 18v52z" />
      <path d="M318 470h196M412 440v30" />
      <circle cx="325" cy="540" r="27" />
      <circle cx="492" cy="540" r="27" />

      {/* The owner's driveway and front path */}
      <path d="M760 600L560 900M840 600l200 300" />
      <path d="M1180 600c20 90 90 170 210 300M1260 600c16 80 80 160 190 300" />

      {/* Lawn, suggested by a few tufts */}
      <path d="M180 700l8-22 8 22M330 790l8-22 8 22M1130 720l8-22 8 22M90 840l8-22 8 22M440 680l8-22 8 22" />

      {/* Porch rail at the bottom edge of the view */}
      <path d="M0 862h520M1080 862h520M40 862v38M200 862v38M360 862v38M1120 862v38M1280 862v38M1440 862v38" />
    </svg>
  )
}
