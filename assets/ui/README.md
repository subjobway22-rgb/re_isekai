# UI 에셋
- `raw/` : 원본 (panel_wood, buttons, sheet)
- `slices/` : 시트에서 잘라낸 개별 PNG (투명 배경), `manifest.json`에 크기 기록
- 9-slice: `panel_wood.png` 모서리 130px, `btn_yellow_hi.png` 슬라이스 60/70/90/60 (CSS border-image 참고: docs/ui-mockup.html)
- 등급 슬롯: common/uncommon/rare/legend/mythic 있음. **epic(보라) 슬롯 없음** → 추가 생성 필요
- `slot_equip_a~c`, `nav_*_alt`, `nav_misc`는 용도 미확정(시트 원본 그대로)
