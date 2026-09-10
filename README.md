# lệnh bash cập nhật game 
git add .
git commit -m "Sea Diver"
git push

# các lệnh thêm, bớt trong css
- sửa lệnh justify-content ở game wrapper nếu muốn game dịch chuyển sang bên trái hoặc bên phải trình duyệt

- muốn thêm skin vào bộ sưu tập thì chỉnh skin-grid 
    - thêm height, overflow-y để mở rộng chỗ cho bst
    - cần thêm padding-right: 4px; để duy trì cảm giác trống thị giác cho người dùng(hạn chế việc giật khung)

- muốn ẩn thanh kéo đi cho đẹp mắt thì thêm skin-grid::webkit-scrollbar{display: none;}

# nếu muốn chỉnh lượt quay thì thực hiện các bước sau
- tìm đến const cost và chỉnh count tùy ý(hiện tại count đang là 1l/10s - 10l/90s)
- muốn được miễn phí lượt quay thì tìm đến hàm pull(count) rồi cho cost = 0, như vậy thì stars sẽ không bị trừ để có thể thực hiện nhiều lượt quay