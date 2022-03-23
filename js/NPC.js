function NPC(params = {}) {
  var exemplo = {
    x: 0,
    y: 0,
    h: 32,
    w: 32,
    vx: 3,
    vy: 3,
    cellsSize: 32,
    assets: undefined,
    mapa: undefined,
    ctx: null,
    frame: 0,
    cond: true,
    rotacao: 50,
    direcao: "direita",
  };
  Object.assign(this, exemplo, params);
}
NPC.prototype = new NPC();
NPC.prototype.constructor = NPC;

NPC.prototype.render = function (dt) {
  this.frame += this.rotacao * dt;
  var F = Math.floor(this.frame);
  this.ctx.drawImage(
    this.assets.img("pack"),
    110 + (F % 3) * 36,
    82,
    38,
    36,
    this.x,
    this.y,
    this.w,
    this.h
  );
};

NPC.prototype.mover = function () {
  //Posição do NPC no map
  this.mc = Math.floor((this.x + this.w / 2) / this.cellsSize);
  this.ml = Math.floor((this.y + this.h / 2) / this.cellsSize);

  var debaixo = Math.floor(this.y / this.cellsSize);
  var decima = Math.floor((this.y + this.h) / this.cellsSize);

  var direita = Math.floor(this.x / this.cellsSize);
  var esquerda = Math.floor((this.x + this.w) / this.cellsSize);

  if (this.direcao == "y") {
    //CIMA
    if (this.cond && this.mapa.cells[this.mc][decima - 1].tipo != 1) {
      this.y -= this.vy;
    } else {
      this.cond = false;
    }
    //BAIXO
    if (!this.cond && this.mapa.cells[this.mc][debaixo + 1].tipo != 1) {
      this.y += this.vy;
    } else {
      this.cond = true;
    }
  } else if (this.direcao == "x") {
    //DIREITA
    if (this.cond && this.mapa.cells[direita + 1][this.ml].tipo != 1) {
      this.x += this.vx;
    } else {
      this.cond = false;
    }
    //ESQUERDA
    if (!this.cond && this.mapa.cells[esquerda - 1][this.ml].tipo != 1) {
      this.x -= this.vx;
    } else {
      this.cond = true;
    }
  }
};

NPC.prototype.moverMenu = function (direcao) {
  if (direcao == "-" && this.y > 500) this.y = this.y - 100;
  else if (direcao == "+" && this.y <= 500) this.y = this.y + 100;
};
NPC.prototype.desenharMenu = function () {
  ctx.drawImage(assetsMng.img("menu-select"), this.x, this.y, 300, 60);
};
NPC.prototype.colidiuCom = function (alvo) {
  // + e - numeros para dar uma margem a mais para colisão
  if (alvo.x + alvo.w - 5 < this.x) return false;
  if (alvo.x + 5 > this.x + this.w) return false;
  if (alvo.y + alvo.h - 2 < this.y) return false;
  if (alvo.y + 8 > this.y + this.h) return false;

  return true;
};
NPC.prototype.SpikeColidiuCom = function (alvo) {
  if (alvo.x + alvo.w - 2 < this.x) return false;
  if (alvo.x + 2 > this.x + this.w) return false;
  if (alvo.y + alvo.h - 2 < this.y) return false;
  if (alvo.y + 2 > this.y + this.h) return false;

  return true;
};

NPC.prototype.moverCircular = function () {
  //Posição do NPC no map
  this.mc = Math.floor((this.x + this.w / 2) / this.cellsSize);
  this.ml = Math.floor((this.y + this.h / 2) / this.cellsSize);

  var debaixo = Math.floor(this.y / this.cellsSize);
  var decima = Math.floor((this.y + this.h) / this.cellsSize);

  var direita = Math.floor((this.x + 1) / this.cellsSize);
  var esquerda = Math.floor((this.x + this.w - 1) / this.cellsSize);

  switch (this.direcao) {
    case "direita":
      if (this.mapa.cells[direita + 1][this.ml].tipo != 1) {
        this.x += this.vx;
        this.direcao = "direita";
      } else {
        this.direcao = "baixo";
      }
      break;
    case "baixo":
      if (this.mapa.cells[this.mc][debaixo + 1].tipo != 1) {
        this.y += this.vy;
        this.direcao = "baixo";
      } else {
        this.direcao = "esquerda";
      }
      break;
    case "esquerda":
      if (this.mapa.cells[esquerda - 1][this.ml].tipo != 1) {
        this.x -= this.vx;
        this.direcao = "esquerda";
      } else {
        this.direcao = "cima";
      }
      break;
    case "cima":
      if (this.mapa.cells[this.mc][decima - 1].tipo != 1) {
        this.y -= this.vy;
      } else {
        this.direcao = "direita";
      }
      break;
    default:
      break;
  }
};
