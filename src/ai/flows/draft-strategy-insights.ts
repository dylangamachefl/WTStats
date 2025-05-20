'use server';
/**
 * @fileOverview An AI agent providing draft strategy insights based on historical league data.
 *
 * - getDraftStrategyInsights - A function that returns insights on optimal draft strategies.
 * - DraftStrategyInsightsInput - The input type for the getDraftStrategyInsights function.
 * - DraftStrategyInsightsOutput - The return type for the getDraftStrategyInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DraftStrategyInsightsInputSchema = z.object({
  leagueHistory: z
    .string()
    .describe('JSON string of historical league data, including draft results and season outcomes.'),
});
export type DraftStrategyInsightsInput = z.infer<typeof DraftStrategyInsightsInputSchema>;

const DraftStrategyInsightsOutputSchema = z.object({
  keyInsights: z
    .array(z.string())
    .describe('A list of key insights on optimal draft strategies.'),
  suggestedStrategies: z
    .array(z.string())
    .describe('A list of suggested draft strategies based on the insights.'),
  overallGrade: z.string().describe('An overall grade for the suggested draft strategies.'),
});
export type DraftStrategyInsightsOutput = z.infer<typeof DraftStrategyInsightsOutputSchema>;

export async function getDraftStrategyInsights(input: DraftStrategyInsightsInput): Promise<DraftStrategyInsightsOutput> {
  return draftStrategyInsightsFlow(input);
}

const draftStrategyInsightsPrompt = ai.definePrompt({
  name: 'draftStrategyInsightsPrompt',
  input: {schema: DraftStrategyInsightsInputSchema},
  output: {schema: DraftStrategyInsightsOutputSchema},
  prompt: `You are an expert fantasy football analyst. Analyze the provided historical league data to provide insights on optimal draft strategies.

League History: {{{leagueHistory}}}

Based on this data, provide:

1.  A list of key insights on optimal draft strategies.
2.  A list of suggested draft strategies based on the insights.
3.  An overall grade for the suggested draft strategies.

Ensure the output is well-formatted and easy to understand.
`,
});

const draftStrategyInsightsFlow = ai.defineFlow(
  {
    name: 'draftStrategyInsightsFlow',
    inputSchema: DraftStrategyInsightsInputSchema,
    outputSchema: DraftStrategyInsightsOutputSchema,
  },
  async input => {
    const {output} = await draftStrategyInsightsPrompt(input);
    return output!;
  }
);
