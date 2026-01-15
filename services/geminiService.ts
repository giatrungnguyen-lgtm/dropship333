
import { GoogleGenAI, Type } from "@google/genai";

// Fix: Initializing GoogleGenAI with apiKey directly from process.env.API_KEY as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMarketingContent = async (productName: string, retailPrice: number) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Hãy viết 3 mẫu quảng cáo Facebook thu hút cho sản phẩm "${productName}" với giá bán lẻ là ${retailPrice.toLocaleString()}đ. 
      Yêu cầu: Ngôn ngữ trẻ trung, nhấn mạnh lợi ích, có lời kêu gọi hành động mạnh mẽ và các hashtag phù hợp.`,
      config: {
        temperature: 0.8,
      }
    });
    // Fix: Accessing .text as a property
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Không thể tạo nội dung lúc này. Vui lòng thử lại sau.";
  }
};

export const analyzeSalesPerformance = async (stats: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Dựa trên dữ liệu bán hàng dropshipping sau: ${stats}. 
      Hãy phân tích hiệu quả kinh doanh, xu hướng lợi nhuận và đưa ra 3 lời khuyên marketing để tăng doanh số trong tuần tới.`,
      config: {
        temperature: 0.5,
      }
    });
    // Fix: Accessing .text as a property
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Không thể phân tích dữ liệu lúc này.";
  }
};

export const extractOrderInfo = async (text: string) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Trích xuất thông tin đơn hàng từ đoạn văn bản sau: "${text}". 
      Hãy tìm: tên khách hàng, số điện thoại, địa chỉ, giá bán sản phẩm (số), tiền đã đặt cọc (số), phí vận chuyển (số), ngày giao hàng (định dạng YYYY-MM-DD), và ghi chú. 
      Trả về kết quả dưới định dạng JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            customerName: { type: Type.STRING },
            customerPhone: { type: Type.STRING },
            customerAddress: { type: Type.STRING },
            retailPrice: { type: Type.NUMBER },
            deposit: { type: Type.NUMBER, description: "Tiền khách đã cọc trước" },
            shippingFee: { type: Type.NUMBER, description: "Phí ship" },
            deliveryDate: { type: Type.STRING, description: "Ngày giao hàng YYYY-MM-DD" },
            note: { type: Type.STRING },
            productHint: { type: Type.STRING, description: "Tên sản phẩm nếu có nhắc tới" }
          }
        }
      }
    });
    // Fix: Safely handling response.text for JSON parsing
    const jsonStr = response.text || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Extraction Error:", error);
    return null;
  }
};
