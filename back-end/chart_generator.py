# chart_generator.py
import pandas as pd
import mplfinance as mpf
import io
from typing import List, Dict, Any
from datetime import datetime
import traceback 

def create_chart_image(data: List[Dict[str, Any]], chart_type: str = 'candle') -> io.BytesIO:
    """
    Tạo hình ảnh biểu đồ (candlestick hoặc line) từ dữ liệu giá 
    và lưu vào một buffer trong bộ nhớ (BytesIO).
    """
    
    if not data or len(data) == 0:
        print("Cảnh báo: Không có dữ liệu để vẽ biểu đồ.")
        return io.BytesIO()

    try:
        df = pd.DataFrame(data)
        
        if 'date' not in df.columns:
            print("Lỗi: Dữ liệu thiếu cột 'date'")
            return io.BytesIO()

        df['date'] = pd.to_datetime(df['date'])
        df = df.set_index('date')
        
        df.rename(columns={
            'open': 'Open',
            'high': 'High',
            'low': 'Low',
            'close': 'Close',
            'volume': 'Volume'
        }, inplace=True)
        
        for col in ['Open', 'High', 'Low', 'Close', 'Volume']:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            else:
                df[col] = 0 

        if len(df) < 2:
            print(f"Lỗi: Dữ liệu không đủ ({len(df)} hàng) để vẽ biểu đồ. Cần ít nhất 2 hàng.")
            return io.BytesIO()

        # 3. Định nghĩa style tối
        mc = mpf.make_marketcolors(
            up='#26a69a', down='#ef5350',
            wick={'up':'#26a69a', 'down':'#ef5350'},
            volume={'up':'#26a69a', 'down':'#ef5350'},
            edge='inherit'
        )
        
        style = mpf.make_mpf_style(
            base_mpf_style='nightclouds', 
            marketcolors=mc,
            gridstyle='-',
            
            # === SỬA LỖI LÀ ĐÂY ===
            # Đổi từ 'rgba(255, 255, 255, 0.1)' sang hex
            gridcolor='#FFFFFF1A', 
            # =======================
            
            facecolor='#141414', 
            figcolor='#141414'
        )

        # 4. Tạo buffer
        buf = io.BytesIO()
        plot_type = 'candle' if chart_type == 'candle' else 'line'
        
        # 5. Vẽ biểu đồ
        try:
            mpf.plot(
                df,
                type=plot_type,
                style=style,
                volume=True,
                panel_ratios=(3, 1),
                datetime_format='%b %d',
                xrotation=0,
                figsize=(12, 6),
                savefig=dict(
                    fname=buf, dpi=100,
                    pad_inches=0.1, bbox_inches='tight'
                )
            )
        except Exception as plot_error:
            print(f"--- LỖI KHI VẼ BIỂU ĐỒ (mpf.plot) ---")
            print(f"Error: {plot_error}")
            traceback.print_exc()
            print(f"--- KẾT THÚC TRACEBACK ---")
            return io.BytesIO()
        
        # 6. Trả về buffer
        buf.seek(0)
        return buf

    except Exception as e:
        print(f"--- LỖI KHI XỬ LÝ DỮ LIỆU (pandas) ---")
        print(f"Error: {e}")
        traceback.print_exc() 
        print(f"--- KẾT THÚC TRACEBACK ---")
        return io.BytesIO()