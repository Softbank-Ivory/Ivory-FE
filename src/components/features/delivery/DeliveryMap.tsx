
export function DeliveryMap() {

  return (
    <div className="relative w-full h-full">
        {/* Background Map Image */}
        {/* Force Fill: We trust the parent Aspect Ratio Container to be correct. */}
        <img
          src="/svg/Streetmap_01_bright.svg"
          alt="Delivery Map"
          className="w-full h-full block"
        />
    </div>
  );
}
