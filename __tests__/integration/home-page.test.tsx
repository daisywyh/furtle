import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import HomePage from "@/app/page";
import { IVF_MEDICATIONS } from "@/lib/ivf-medications";

// Mock Next.js navigation
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe("HomePage", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders the page heading", () => {
    render(<HomePage />);
    expect(
      screen.getByText(/Check your IVF medication coverage/i)
    ).toBeInTheDocument();
  });

  it("renders all 3 how-it-works steps", () => {
    render(<HomePage />);
    expect(screen.getByText(/Select your medications/i)).toBeInTheDocument();
    expect(screen.getByText(/Check coverage instantly/i)).toBeInTheDocument();
    expect(screen.getByText(/Get next steps/i)).toBeInTheDocument();
  });

  it("shows the Aetna plan indicator", () => {
    render(<HomePage />);
    expect(screen.getByText(/Aetna 2026 Standard Plan/i)).toBeInTheDocument();
  });

  it("renders all IVF medication checkboxes", () => {
    render(<HomePage />);
    for (const med of IVF_MEDICATIONS) {
      expect(
        screen.getByRole("checkbox", { name: med.displayName })
      ).toBeInTheDocument();
    }
  });

  it("Check Coverage button is disabled when nothing is selected", () => {
    render(<HomePage />);
    const btn = screen.getByRole("button", { name: /Check Coverage/i });
    expect(btn).toBeDisabled();
  });

  it("enables Check Coverage button when a medication is selected", async () => {
    const user = userEvent.setup();
    render(<HomePage />);
    const first = screen.getByRole("checkbox", {
      name: IVF_MEDICATIONS[0].displayName,
    });
    await user.click(first);
    const btn = screen.getByRole("button", { name: /Check Coverage/i });
    expect(btn).not.toBeDisabled();
  });

  it("enables Check Coverage button when free text is entered", async () => {
    const user = userEvent.setup();
    render(<HomePage />);
    const textarea = screen.getByRole("textbox", {
      name: /Additional medications/i,
    });
    await user.type(textarea, "CustomDrug");
    const btn = screen.getByRole("button", { name: /Check Coverage/i });
    expect(btn).not.toBeDisabled();
  });

  it("navigates to /results with selected drugs as query params on submit", async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await user.click(
      screen.getByRole("checkbox", { name: IVF_MEDICATIONS[0].displayName })
    );
    await user.click(screen.getByRole("button", { name: /Check Coverage/i }));

    expect(mockPush).toHaveBeenCalledTimes(1);
    const url: string = mockPush.mock.calls[0][0];
    expect(url).toMatch(/^\/results\?/);
    expect(url).toContain("medId=");
  });

  it("includes zip code in the results URL when provided", async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await user.click(
      screen.getByRole("checkbox", { name: IVF_MEDICATIONS[0].displayName })
    );
    const zipInput = screen.getByLabelText(/Zip code for pharmacy finder/i);
    await user.type(zipInput, "94305");
    await user.click(screen.getByRole("button", { name: /Check Coverage/i }));

    const url: string = mockPush.mock.calls[0][0];
    expect(url).toContain("zip=94305");
  });

  it("shows selection count in submit button label", async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await user.click(
      screen.getByRole("checkbox", { name: IVF_MEDICATIONS[0].displayName })
    );
    await user.click(
      screen.getByRole("checkbox", { name: IVF_MEDICATIONS[1].displayName })
    );

    expect(
      screen.getByRole("button", { name: /2 medications selected/i })
    ).toBeInTheDocument();
  });

  it("unchecking a medication removes it from the selection count", async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    const checkbox = screen.getByRole("checkbox", {
      name: IVF_MEDICATIONS[0].displayName,
    });
    await user.click(checkbox);
    await user.click(checkbox); // uncheck

    const btn = screen.getByRole("button", { name: /Check Coverage/i });
    expect(btn).toBeDisabled();
  });
});
