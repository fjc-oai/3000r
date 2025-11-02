// Preset schedules for the Back Mechanic timer

export function createId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const PRESET_SCHEDULES = [
  {
    id: "preset_simple_big_three",
    name: "Simple Big Three (starter)",
    breakBetweenExercisesSeconds: 60,
    exercises: [
      {
        id: createId("ex"),
        name: "Modified Curl-Up",
        breakBetweenSetsSeconds: 30,
        sets: [
          { id: createId("set"), reps: 5, holdSeconds: 10, breakBetweenRepsSeconds: 10 },
          { id: createId("set"), reps: 5, holdSeconds: 10, breakBetweenRepsSeconds: 10 },
        ],
      },
      {
        id: createId("ex"),
        name: "Side Plank (left/right)",
        breakBetweenSetsSeconds: 30,
        sets: [
          { id: createId("set"), reps: 5, holdSeconds: 10, breakBetweenRepsSeconds: 10 },
          { id: createId("set"), reps: 5, holdSeconds: 10, breakBetweenRepsSeconds: 10 },
        ],
      },
      {
        id: createId("ex"),
        name: "Bird-Dog",
        breakBetweenSetsSeconds: 30,
        sets: [
          { id: createId("set"), reps: 5, holdSeconds: 10, breakBetweenRepsSeconds: 10 },
          { id: createId("set"), reps: 5, holdSeconds: 10, breakBetweenRepsSeconds: 10 },
        ],
      },
    ],
  },
  {
    id: "preset_minimal_demo",
    name: "Minimal Demo",
    breakBetweenExercisesSeconds: 15,
    exercises: [
      {
        id: createId("ex"),
        name: "Hold 1",
        breakBetweenSetsSeconds: 10,
        sets: [
          { id: createId("set"), reps: 3, holdSeconds: 5, breakBetweenRepsSeconds: 5 },
        ],
      },
      {
        id: createId("ex"),
        name: "Hold 2",
        breakBetweenSetsSeconds: 10,
        sets: [
          { id: createId("set"), reps: 2, holdSeconds: 8, breakBetweenRepsSeconds: 5 },
        ],
      },
    ],
  },
];


