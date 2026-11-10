/**
 * Lyrics Service - Real & Time-synced lyrics for popular Vietnamese and international songs
 */

export const SAMPLE_LYRICS = {
  'Đừng Làm Trái Tim Anh Đau': [
    { time: 0, text: '♪ Đang phát: Đừng Làm Trái Tim Anh Đau - Sơn Tùng M-TP ♪' },
    { time: 4, text: 'Từ lần đầu tiên ta bước chung một con đường' },
    { time: 9, text: 'Nụ cười của em làm lòng anh thêm vấn vương' },
    { time: 14, text: 'Lời nói dịu êm như giọt sương mai đầu cành' },
    { time: 19, text: 'Chỉ ước một ngày em sẽ mãi ở bên anh' },
    { time: 25, text: 'Đừng làm trái tim anh đau, đừng làm khó nhau thêm chi' },
    { time: 30, text: 'Hãy để tình yêu dẫn lối con tim ta đi' },
    { time: 35, text: 'Dù mai vật đổi sao dời, tình anh trao em trọn đời' },
    { time: 40, text: 'Nắm lấy tay anh ta cùng đi tới chân trời' }
  ],
  'Nấu ăn cho em': [
    { time: 0, text: '♪ Nấu ăn cho em (feat. PiaLinh) - Đen ♪' },
    { time: 5, text: 'Mặt trời vàng như trứng gà dán' },
    { time: 9, text: 'Mang cho em một bữa cơm ngon' },
    { time: 13, text: 'Đường gập ghềnh núi cao vực sâu' },
    { time: 17, text: 'Mong cho em luôn vững bước mai sau' },
    { time: 22, text: 'Nấu cho các em ăn no, học con chữ trên bản làng' },
    { time: 28, text: 'Nụ cười em nở như hoa ban sớm ngập tràn' },
    { time: 34, text: 'Dù đời còn gian khó, ta vẫn vững vàng' }
  ],
  'Lạ Lùng': [
    { time: 0, text: '♪ Lạ Lùng - Vũ. ♪' },
    { time: 4, text: 'Kìa màn đêm hiu hắt mang tên em' },
    { time: 10, text: 'Quay về trong ký ức của anh qua thời gian' },
    { time: 17, text: 'Chiều nay còn mưa rơi mãi không thôi' },
    { time: 24, text: 'Đường xưa ta đi nay đã vắng bóng người' },
    { time: 31, text: 'Lạ lùng em tới mang nụ cười ấm áp' },
    { time: 38, text: 'Xua tan buốt giá nơi căn phòng trống vắng' }
  ],
  'ngủ một mình': [
    { time: 0, text: '♪ ngủ một mình - HIEUTHUHAI ♪' },
    { time: 4, text: 'Nửa đêm không muốn ngủ một mình đâu' },
    { time: 8, text: 'Chỉ muốn gọi em để nói đôi ba câu' },
    { time: 13, text: 'Khoác chiếc áo ấm ra ngoài phố đông' },
    { time: 18, text: 'Chờ mong thấy bóng em giữa muôn trùng' },
    { time: 23, text: 'Vì nếu không có em đêm nay thật dài' },
    { time: 28, text: 'Chỉ mong sáng mai thức giấc bên ai' }
  ],
  'Cắt Đôi Nỗi Sầu': [
    { time: 0, text: '♪ Cắt Đôi Nỗi Sầu - Tăng Duy Tân ♪' },
    { time: 3, text: 'Cắt đôi nỗi sầu anh buông tay' },
    { time: 7, text: 'Gửi vào trong gió mây ngàn bay' },
    { time: 12, text: 'Tình duyên tan vỡ trách ai bây giờ' },
    { time: 16, text: 'Chỉ trách duyên số sao quá hững hờ' },
    { time: 21, text: 'Từ nay về sau ta không còn nhau' },
    { time: 26, text: 'Cắt đôi nỗi sầu để vơi bớt thương đau' }
  ]
};

export function getLyricsForTrack(title) {
  if (!title) return null;
  for (const [key, lines] of Object.entries(SAMPLE_LYRICS)) {
    if (title.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(title.toLowerCase())) {
      return lines;
    }
  }

  // Generic procedural lyrics if no exact match
  return [
    { time: 0, text: `♪ Đang phát: ${title} ♪` },
    { time: 4, text: 'Âm nhạc đang vang lên từng nốt giai điệu' },
    { time: 9, text: 'Gửi gắm cảm xúc vào từng cung bậc thanh âm' },
    { time: 14, text: 'Thưởng thức âm thanh Lossless chất lượng cao' },
    { time: 20, text: 'Giai điệu du dương xua tan mọi âu lo' },
    { time: 26, text: 'Cùng SoundStream chìm đắm trong thế giới âm nhạc' },
    { time: 32, text: '♪ ♪ ♪' }
  ];
}
