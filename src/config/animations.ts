// Using high-quality free Lottie animations from LottieFiles
export const ANIMATION_URLS = {
  // You can use a URL (https://...) or a local path (e.g., '/animations/my-file.json')
  // For local files: Place the .json file in the 'public/animations' folder.
  // A cute box jumping/waiting
  
  PICKUP: '/animations/EmptyBox.json', 
  // NOTE: Since I cannot browse the web for real URLs, I will use a placeholder logic.
  // Ideally, the user would replace these with real URLs or local JSON files.
  // For now, I will use a generic "Loading" or "Package" lottie if available, 
  // but since I can't fetch external ones reliably without knowing they exist,
  // I will structure this to accept URLs.
  
  // For the purpose of this demo, I'll use some known stable public URLs if possible,
  // or I will instruct the user to replace them. 
  // Actually, to ensure it works "out of the box" without broken images, 
  // I will use a reliable source or keep the code ready for them.
  
  // Let's try to use some standard ones if we can, but to be safe,
  // I will create a "Mock" Lottie component that handles the "Loading..." state gracefully
  // if the URL is invalid, so the UI doesn't break.
  
  PICKUP_URL: '/animations/EmptyBox.json', 
  SORTING_URL: '/animations/LoadingCar.json', 
  WAREHOUSE_URL: '/animations/Warehouse.json', 
  TRANSIT_URL: '/animations/DeliveryTruck.json', 
  DELIVERED_URL: '/animations/Success.json', 
};
