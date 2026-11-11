/*
This file tests the page for unknown addresses.
Edit this file when the "page not found" page or the catch-all route changes.
Copy a test pattern here when you add tests for another simple page.
*/

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { NotFoundPage } from "./NotFoundPage";

describe("NotFoundPage", () => {
  it("explains the problem and links back home", () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to home page" })).toHaveAttribute("href", "/");
  });
});
