import React from "react";
import Cards from "../components/Cards";
import { AttachmentUpload } from "../components/AttachmentUpload";

const Files = () => {
  return (
    <div className="pb-10 mt-10 md:max-w-4xl mx-auto">
      <h1 className=" text-5xl text-left font-bold ">Transfers</h1>
      <p className="mb-6 text-left text-muted mt-4 max-w-[50ch]">
        Files go straight from your device to theirs. Nothing is uploaded to a
        server.
      </p>
      <div className="grid w-full grid-cols-[40%_60%] gap-5">
        <Cards padding="p-4 sm:p-4" borderRadius="rounded-2xl">
          <p className="mb-6 text-sm uppercase text-left text-muted">
            Send a file
          </p>
                  <AttachmentUpload />
                  <p className="mb-6 text-sm uppercase text-left text-muted">
            Send a file
          </p>
        </Cards>
      </div>
    </div>
  );
};

export default Files;
