class Pasien {
  constructor(userID, nama, email, password) {
    this.userID = userID;
    this.nama = nama;
    this.email = email;
    this.password = password;
  }

  register() {}
  login() {}
  _lihatLaporanKepatuhan() {}
  inputJadwalObat() {}
  chatDenganAI() {}
}

class Obat {
  constructor(obatID, namaObat, keterangan, dosis, efekSamping) {
    this.obatID = obatID;
    this.namaObat = namaObat;
    this.keterangan = keterangan;
    this.dosis = dosis;
    this.efekSamping = efekSamping;
  }

  tambahObat() {}
  hapusObat() {}
}

class AI_Assistant {
  constructor(aiID, keterangan, model) {
    this.aiID = aiID;
    this.keterangan = keterangan;
    this.model = model;
  }

  textToSpeech() {}
  speechToText() {}
  responChat() {}
}

class Chat {
  constructor(chatID, chat, responAI, waktu) {
    this.chatID = chatID;
    this.chat = chat;
    this.responAI = responAI;
    this.waktu = waktu;
  }

  kirimPesan() {}
  terimaRespon() {}
}

class Laporan_kepatuhan {
  constructor(laporanID, tanggal, statusKepatuhan) {
    this.laporanID = laporanID;
    this.tanggal = tanggal;
    this.statusKepatuhan = statusKepatuhan;
  }

  _CheckKepatuhan() {}
  GenerateLaporan() {}
  ShareLaporan() {}
}

class Jadwal_Obat {
  constructor(jadwalID, namaObat, jenisObat, waktuMinum, dosis) {
    this.jadwalID = jadwalID;
    this.namaObat = namaObat;
    this.jenisObat = jenisObat;
    this.waktuMinum = waktuMinum;
    this.dosis = dosis;
  }

  TambahJadwal() {}
  EditJadwal() {}
  HapusJadwal() {}
}

class Reminder {
  constructor(waktuKirim, status) {
    this.waktuKirim = waktuKirim;
    this.status = status;
  }

  kirimNotifikasi() {}
  ubahStatus() {}
}

class Interaksi_Obat {
  constructor(interaksiID, obat1, obat2, tingkatRisiko, hasilInteraksi) {
    this.interaksiID = interaksiID;
    this.obat1 = obat1;
    this.obat2 = obat2;
    this.tingkatRisiko = tingkatRisiko;
    this.hasilInteraksi = hasilInteraksi;
  }

  cekInteraksi() {}
  tambahObat() {}
  hapusObat() {}
}

module.exports = {
  Pasien, Obat, AI_Assistant, Chat, Laporan_kepatuhan, Jadwal_Obat, Reminder, Interaksi_Obat
};
