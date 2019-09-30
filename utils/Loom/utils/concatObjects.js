export const concatObjects = objectArray =>
  objectArray.reduce(
    (prev, object) => ({
      ...prev,
      ...object
    }),
    {}
  )
