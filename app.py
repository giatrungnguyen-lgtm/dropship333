import streamlit as st
import google.generativeai as genai

# 1. Cấu hình giao diện Web
st.set_page_config(page_title="DropShip AI Assistant", page_icon="📦")
st.title("📦 Trợ lý DropShip 333")
st.write("Hỏi tôi bất cứ điều gì về chiến lược dropshipping, tìm nguồn hàng, v.v.")

# 2. Cấu hình API Key (Lấy từ hệ thống bảo mật của Streamlit)
try:
    # Kiểm tra xem Key có tồn tại không
    if "GOOGLE_API_KEY" in st.secrets:
        api_key = st.secrets["GOOGLE_API_KEY"]
        genai.configure(api_key=api_key)
    else:
        st.error("⚠️ Chưa tìm thấy API Key. Vui lòng vào cài đặt Secrets trên Streamlit để thêm.")
        st.stop()
except Exception as e:
    st.error(f"Lỗi cấu hình: {e}")
    st.stop()

# 3. Chọn Model AI (Gemini Flash cho nhanh và rẻ)
model = genai.GenerativeModel('gemini-1.5-flash')

# 4. Khởi tạo lịch sử chat
if "messages" not in st.session_state:
    st.session_state.messages = []

# 5. Hiển thị lịch sử chat cũ lên màn hình
for message in st.session_state.messages:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])

# 6. Xử lý khi bạn nhập câu hỏi
if prompt := st.chat_input("Nhập câu hỏi của bạn tại đây..."):
    # Hiện câu hỏi của bạn
    st.chat_message("user").markdown(prompt)
    st.session_state.messages.append({"role": "user", "content": prompt})

    # Gọi Google AI trả lời
    try:
        with st.spinner("AI đang suy nghĩ..."):
            response = model.generate_content(prompt)
            text_response = response.text

        # Hiện câu trả lời của AI
        with st.chat_message("assistant"):
            st.markdown(text_response)
        st.session_state.messages.append({"role": "assistant", "content": text_response})

    except Exception as e:
        st.error(f"Đã xảy ra lỗi kết nối: {e}")
