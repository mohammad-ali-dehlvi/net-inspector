import { RouterProvider } from "react-router";
import { router } from "src/client/routes";


function App() {

  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;