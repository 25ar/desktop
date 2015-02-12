(function() {
  
  var _CPAAd = function() {
    var ads = {
      "BR": [
        {
          title: "OLX",
          url: "http://goo.mx/MJZjIb",
          preview: "https://s3.amazonaws.com/fvd-special/dials_ad/OLX.jpg"
        },
        {
          title: "Netshoes",
          url: "http://goo.mx/773QVn",
          preview: "https://s3.amazonaws.com/fvd-special/dials_ad/netshoes.jpg"
        },
        {
          title: "Dafiti",
          url: "http://goo.mx/iEzYBf",
          preview: "https://s3.amazonaws.com/fvd-special/dials_ad/dafiti.jpg"
        },
        {
          title: "Bom Negócio",
          url: "http://goo.mx/Mfe6nm",
          preview: "https://s3.amazonaws.com/fvd-special/dials_ad/bomnegocio.jpg" 
        },
        {
          title: "Ricardo Eletro",
          url: "http://goo.mx/267Nbi",
          preview: "https://s3.amazonaws.com/fvd-special/dials_ad/Ricardo-Eletro.jpg"
        },
        {
          title: "Magazine Luiza",
          url: "http://goo.mx/6ZJbIj",
          preview: "https://s3.amazonaws.com/fvd-special/dials_ad/Magazine-Luiza.jpg"
        },
        {
          title: "TAM",
          url: "http://goo.mx/fIneEz",
          preview: "https://s3.amazonaws.com/fvd-special/dials_ad/TAM.jpg"
        },
        {
          title: "Centauro",
          url: "http://goo.mx/BrYvEf",
          preview: "https://s3.amazonaws.com/fvd-special/dials_ad/Centauro.jpg"
        },
        {
          title: "Mini in the box",
          url: "http://goo.mx/EFbMBj",
          preview: "https://s3.amazonaws.com/fvd-special/dials_ad/miniinthebox.jpg"
        },
        {
          title: "Marisa",
          url: "http://goo.mx/JV3Iv2",
          preview: "https://s3.amazonaws.com/fvd-special/dials_ad/Marisa.jpg"
        }
      ],
      "US": [
        {
          title: "Bigfarm",
          url: "http://goo.mx/yAv6Vv",
          preview: "https://s3.amazonaws.com/fvd-special/dials_ad/big-farm.jpg"
        },
        {
          title: "Empire",
          url: "http://goo.mx/VruQru",
          preview: "https://s3.amazonaws.com/fvd-special/dials_ad/Empire.jpg"
        }
      ]
    };
    
    this.getADForCountry = function(country, cnt) {
      var a = ads[country];
      if(!a) {
        return [];
      }
      a = fvdSpeedDial.Utils.shuffle(a);
      var r = a.slice(0, cnt);
      // prepare
      r.forEach(function(o) {
        o.thumb_source_type = "url";
        o.thumb_url = o.preview;
        delete o.preview;
      });
      return r;
    };
  };
  
  CPAAd = new _CPAAd();
})();
