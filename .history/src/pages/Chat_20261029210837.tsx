
const Chat = () => {

  return (
    <div className="w-full gap-10 text-center flex items-center justify-between flex-col pb-10 mt-10 md:max-w-4xl mx-auto">
     
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-1 bg-[radial-gradient(60%_50%_at_50%_0%,rgb(255_159_10/0.18),transparent_80%)]"
      />

          <div className="grid grid-cols-[30%_70%]" >
              <Sidebar/>
  </div>
   
    </div>
  );
};

export default Chat;