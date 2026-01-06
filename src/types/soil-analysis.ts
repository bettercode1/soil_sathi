export type SoilAnalysis = {
  language: string;
  overview: string;
  soilQuality: {
    rating: string;
    score: number;
    description: string;
  };
  nutrientAnalysis: Array<{
    parameter: string;
    value: string;
    status: string;
    impact: string;
    recommendation: string;
  }>;
  fertilizerRecommendations: {
    chemical: Array<{
      name: string;
      quantity: string;
      timing: string;
      application: string;
      notes: string;
    }>;
    organic: Array<{
      name: string;
      quantity: string;
      timing: string;
      application: string;
      notes: string;
    }>;
  };
  improvementPlan: Array<{
    action: string;
    benefit: string;
    priority: string;
  }>;
  warnings: string[];
  nextSteps: string[];
  sectionTitles: {
    overview: string;
    soilQuality: string;
    nutrientAnalysis: string;
    chemicalPlan: string;
    organicPlan: string;
    improvementPlan: string;
    warnings: string;
    nextSteps: string;
  };
  analysisTimestamp: string;
};
