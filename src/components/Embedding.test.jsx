import React from "react";
import { render, screen } from "@testing-library/react";

import Embedding from "./Embedding";

jest.mock("./TextArea", () => function MockTextArea(props) {
  return (
    <pre data-testid={`text-area-${props.type ?? "text"}`}>
      {props.content}
    </pre>
  );
});

test("renders JSON-like vendor MIME types with the JSON viewer path", () => {
  render(
    <Embedding
      content={[
        {
          mime_type: "application/vnd.allure.message+json",
          data: "{\"type\":\"metadata\",\"data\":{\"labels\":[{\"name\":\"story\",\"value\":\"Login\"}]}}"
        }
      ]}
      themeName="light"
      sourceKey="vendor-json"
    />
  );

  expect(screen.getByTestId("text-area-json").textContent).toMatch(/"type":\s*"metadata"/);
  expect(screen.getByTestId("text-area-json").textContent).toMatch(/"story"/);
});

test("renders non-PNG images using their original MIME type", () => {
  render(
    <Embedding
      content={[
        {
          mime_type: "image/jpeg",
          data: "ZmFrZS1pbWFnZS1ieXRlcw=="
        }
      ]}
      themeName="light"
      sourceKey="jpeg-image"
    />
  );

  expect(screen.getByRole("img", { name: /image\/jpeg attachment/i }).getAttribute("src"))
    .toBe("data:image/jpeg;base64,ZmFrZS1pbWFnZS1ieXRlcw==");
});

test("renders video attachments with a native video player", () => {
  const { container } = render(
    <Embedding
      content={[
        {
          mime_type: "video/webm",
          data: "ZmFrZS12aWRlby1ieXRlcw=="
        }
      ]}
      themeName="light"
      sourceKey="webm-video"
    />
  );

  const video = screen.getByLabelText(/video\/webm attachment/i);
  expect(video.tagName).toBe("VIDEO");
  expect(container.querySelector("source")).not.toBeNull();
  expect(container.querySelector("source").getAttribute("src"))
    .toBe("data:video/webm;base64,ZmFrZS12aWRlby1ieXRlcw==");
});
