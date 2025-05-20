/**
 * Processes code blocks and formats them appropriately
 * @param message - The message to process for code blocks
 * @returns Processed message with proper code block formatting
 */
export const processMessageText = (message: string): string => {
  // Helper function to escape special markdown characters in numbers
  const escapeNumbersInText = (text: string): string => {
    // Find patterns like "number." at the end of sentences or followed by spaces
    return text.replace(/(\d+)\.(?!\d)/g, "$1\\.");
  };

  // First, escape numbers that might be mistaken as list items
  let processedMessage = escapeNumbersInText(message);

  // Then add spacing around actual list items that we want to keep as lists
  // Look for lines that start with a number followed by a period and a space
  processedMessage = processedMessage.replace(/^(\d+\.\s)/gm, "\n$1");

  // Improve code block formatting
  // Make sure code blocks have proper language annotation and formatting
  processedMessage = processedMessage.replace(/```(\w+)?/g, (match, lang) => {
    if (!lang) return "```text";
    return match;
  });

  return processedMessage;
};

/**
 * Streams the bot response with a typing effect by updating messages state over time
 * 
 * @param botMessage - The message to display with typing effect
 * @param updateMessage - Function to update the message state
 * @param typingSpeed - Speed of typing effect in milliseconds (default: 10)
 * @returns Promise that resolves when typing is complete
 */
export const streamResponse = (
  botMessage: string,
  updateMessage: (text: string) => void,
  typingSpeed: number = 1
): Promise<void> => {
  return new Promise<void>((resolve) => {
    let currentMessage = "";
    let index = 0;

    // Process the message for better formatting
    const fixedMessage = processMessageText(botMessage);

    const typingEffect = setInterval(() => {
      if (index < fixedMessage.length) {
        currentMessage += fixedMessage[index];
        updateMessage(currentMessage);
        index++;
      } else {
        clearInterval(typingEffect);
        resolve();
      }
    }, typingSpeed);
  });
}; 