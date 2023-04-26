const Geolocation = {
  clearWatch: jest.fn(),
  stopObserving: jest.fn(),
  watchPosition: jest
    .fn()
    .mockImplementation((successCallback, errorCallback, options) => {
      // Return a watch ID value
      return 1;
    }),
};
export default Geolocation;
