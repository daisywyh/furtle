import { buildMapsUrl, buildMyChartMessage } from "@/lib/utils";

describe("buildMapsUrl", () => {
  it("encodes zip code into a Google Maps search URL", () => {
    const url = buildMapsUrl("94305");
    expect(url).toContain("google.com/maps/search/");
    expect(url).toContain("94305");
    expect(url).toContain("specialty");
    expect(url).toContain("pharmacy");
  });

  it("URL-encodes spaces", () => {
    const url = buildMapsUrl("10001");
    expect(url).not.toContain(" ");
  });
});

describe("buildMyChartMessage", () => {
  const baseParams = {
    patientName: "Jane Doe",
    insurer: "Aetna",
    coveredDrugs: ["Clomid"],
    notCoveredDrugs: [],
    priorAuthDrugs: [],
  };

  it("includes insurer name in the message", () => {
    const msg = buildMyChartMessage(baseParams);
    expect(msg).toContain("Aetna");
  });

  it("lists covered drugs as needing no action", () => {
    const msg = buildMyChartMessage(baseParams);
    expect(msg).toContain("Clomid");
    expect(msg).toContain("no action needed");
  });

  it("lists not-covered drugs with prior auth note", () => {
    const msg = buildMyChartMessage({
      ...baseParams,
      coveredDrugs: [],
      notCoveredDrugs: ["Gonal-F"],
    });
    expect(msg).toContain("Gonal-F");
    expect(msg).toContain("prior authorization");
  });

  it("lists prior auth drugs with PA note", () => {
    const msg = buildMyChartMessage({
      ...baseParams,
      coveredDrugs: ["Menopur"],
      priorAuthDrugs: ["Menopur"],
    });
    expect(msg).toContain("prior authorization");
  });

  it("includes patient name in signature when provided", () => {
    const msg = buildMyChartMessage(baseParams);
    expect(msg).toContain("Jane Doe");
  });

  it("uses fallback name placeholder when patient name is empty", () => {
    const msg = buildMyChartMessage({ ...baseParams, patientName: "" });
    expect(msg).toContain("[Your name]");
  });

  it("includes action items when there are PA or not-covered drugs", () => {
    const msg = buildMyChartMessage({
      ...baseParams,
      notCoveredDrugs: ["Luveris"],
    });
    expect(msg).toContain("Submit a prior authorization");
  });

  it("does not include action items when all drugs are cleanly covered", () => {
    const msg = buildMyChartMessage(baseParams);
    expect(msg).not.toContain("Submit a prior authorization");
  });
});
