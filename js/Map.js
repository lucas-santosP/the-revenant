function Map(modelo) {
  exemplo = {
    cells: [],
    LINES: 32,
    COLUMNS: 32,
    SIZE: 32,
    assets: undefined,
    scene: undefined,
    ctx: null,
    frame: 0,
    totalPts: 0,
    K: 0,
    //Vetor de paredes dividos em 4 partes
    wallsLeft: [],
    wallsRight: [],

    //Vetores de NPCs
    spikes: [],
    serrasLineares: [],
    serrasCirculares: [],
    checkPoints: [],
    coracoes: [],
  };
  Object.assign(this, exemplo, modelo);
}

Map.prototype.setFase = function (L) {
  this.K = L;
  this.criaFase();
};
Map.prototype.respawnNPCs = function () {
  for (const i in this.checkPoints) {
    this.checkPoints[i].ativo = false;
  }
  for (const i in this.coracoes) {
    this.coracoes[i].ativo = true;
  }
};
Map.prototype.criaFase = function () {
  this.cells.length = 0;
  this.wallsLeft.length = 0;
  this.wallsRight.length = 0;
  this.spikes.length = 0;
  this.serrasLineares.length = 0;
  this.serrasCirculares.length = 0;
  this.checkPoints.length = 0;
  this.coracoes.length = 0;
  this.totalPts = 0;

  for (var c = 0; c < this.COLUMNS; c++) {
    this.cells[c] = [];
    for (var l = 0; l < this.LINES; l++) {
      exemplo.cells[c][l] = { tipo: 0 };
    }
  }
  if (this.m[this.K]) {
    for (var c = 0; c < this.COLUMNS; c++) {
      for (var l = 0; l < this.LINES; l++) {
        if (typeof this.m[this.K][l][c] == "number")
          this.cells[c][l] = { tipo: this.m[this.K][l][c] };
        else this.cells[c][l] = this.m[this.K][l][c];

        switch (this.cells[c][l].tipo) {
          case 0: //Chão / pontos
            this.totalPts++;
            break;
          case 1: //Paredes
            var parede = {
              x: c * this.SIZE,
              y: l * this.SIZE,
              w: this.SIZE,
              h: this.SIZE,
            };

            if (c < 16) {
              this.wallsLeft.push(parede);
            } else {
              this.wallsRight.push(parede);
            }

            break;
          case 3: //Spikes
            this.spikes.push(
              new NPC({
                x: c * this.SIZE,
                y: l * this.SIZE,
                rotacao: 20,
                assets: this.assets,
                mapa: this,
                ctx: this.ctx,
              })
            );
            break;
          case 4: //Serras lineares
            this.totalPts++;
            this.serrasLineares.push(
              new NPC({
                x: c * this.SIZE,
                y: l * this.SIZE,
                vx: this.cells[c][l].vx,
                vy: this.cells[c][l].vy,
                direcao: this.cells[c][l].direcao,
                assets: this.assets,
                mapa: this,
                ctx: this.ctx,
              })
            );
            break;
          case -4: //Serras circulares
            this.totalPts++;
            this.serrasCirculares.push(
              new NPC({
                x: c * this.SIZE,
                y: l * this.SIZE,
                vx: this.cells[c][l].vx,
                vy: this.cells[c][l].vy,
                assets: this.assets,
                mapa: this,
                ctx: this.ctx,
              })
            );
            break;
          case 5:
            this.totalPts++;
            this.checkPoints.push(
              new NPC_estatico({
                x: c * this.SIZE,
                y: l * this.SIZE,
                w: 28,
                h: 32,
                assets: this.assets,
                mapa: this,
                ctx: this.ctx,
              })
            );
            break;
          case 6:
            this.totalPts++;
            this.coracoes.push(
              new NPC_estatico({
                x: c * this.SIZE,
                y: l * this.SIZE,
                ativo: true,
                assets: this.assets,
                mapa: this,
                ctx: this.ctx,
              })
            );
            break;

          default:
            break;
        }
      }
    }
  }
};

Map.prototype.render = function () {
  for (var c = 0; c < this.COLUMNS; c++) {
    for (var l = 0; l < this.LINES; l++) {
      switch (this.cells[c][l].tipo) {
        case 1:
          //Paredes
          this.ctx.drawImage(
            this.assets.img("pack"),
            0,
            82,
            48,
            47,
            c * this.SIZE,
            l * this.SIZE,
            this.SIZE,
            this.SIZE
          );
          break;
        case 2:
          //Chao final
          this.ctx.drawImage(
            this.assets.img("chao_final"),
            c * this.SIZE,
            l * this.SIZE,
            this.SIZE,
            this.SIZE
          );
          break;
        case 3:
          //Espinhos
          this.ctx.drawImage(
            this.assets.img("chao_final"),
            c * this.SIZE,
            l * this.SIZE,
            this.SIZE,
            this.SIZE
          );
          this.ctx.drawImage(
            this.assets.img("pack"),
            48,
            82,
            50,
            50,
            c * this.SIZE,
            l * this.SIZE,
            this.SIZE,
            this.SIZE
          );
          break;
        default:
          //chao inicial
          this.ctx.drawImage(
            this.assets.img("chao_inicial"),
            c * this.SIZE,
            l * this.SIZE,
            this.SIZE,
            this.SIZE
          );
          break;
      }
      this.ctx.font = "10px verdana";
      //this.ctx.fillText("["+c+","+l+"]", this.SIZE*c, this.SIZE*l+16);
    }
  }
};
Map.prototype.clearMap = function (caminhos) {
  for (const i in caminhos) {
    this.cells[caminhos[i].c][caminhos[i].l].tipo = 0;
  }
};
