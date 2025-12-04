import clipboardIcon from "../../../images/clipboard.png";

export default function ShoppingListsDock() {
  return (
    <>
      <button className="sticky bottom-2 w-full flex justify-end cursor-pointer">
        <img className="w-20" src={clipboardIcon} alt="Shopping Lists" />
      </button>
    </>
  );
}
