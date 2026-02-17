import { useEffect, useState } from "react";
import { Router, RouterProvider } from "react-router";
import { browserService, videoService } from "src/client/services"
import { BrowserStatus } from "src/server/utils/CustomPlaywright";
import { router } from "src/client/routes";


function App() {

  return (
    <>
    <RouterProvider router={router} />
    </>
  );
}

export default App;