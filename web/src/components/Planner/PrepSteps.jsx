import prepIcon from "../../../images/cooking.png";

export default function PrepStepsList() {
  return (
    <>
      <button className="sticky bottom-[100px] w-full flex justify-end cursor-pointer">
        <img className="w-20" src={prepIcon} alt="Prep Lists" />
      </button>
    </>
  );
}
