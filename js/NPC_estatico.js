function NPC_estatico(params = {}) {
    var exemplo = {
        x: 0, y: 0,
        h: 32, w: 32,
        vx: 0, vy: 0,
        mc: 0, my: 0,
        assets: undefined,
        mapa: undefined,
        ctx: null,
        frame: 0,
        ativo: false,
    }
    Object.assign(this, exemplo, params);
}
NPC_estatico.prototype = new NPC_estatico();
NPC_estatico.prototype.constructor = NPC_estatico;

NPC_estatico.prototype.renderCheck = function (dt) {
    this.mc = Math.floor((this.x + (this.w / 2)) / this.mapa.SIZE);
    this.ml = Math.floor((this.y + (this.h / 2)) / this.mapa.SIZE);
    this.frame += 12 * dt;

    if (this.ativo) {
        this.ctx.drawImage(
            this.assets.img("pack"),
            0,
            0,
            55,
            51,
            this.x - 9,//para centralizar
            this.y,
            this.w + 20,
            this.h,
        );
    }
    else {
        this.ctx.drawImage(
            this.assets.img("pack"),
            55,
            0,
            55,
            51,
            this.x - 9,//para centralizar
            this.y,
            this.w + 20,
            this.h,
        );

    }
}

NPC_estatico.prototype.renderDeath = function (dt) {

    this.frame += 10 * dt;
    var F = Math.floor(this.frame);
    this.ctx.drawImage(
        this.assets.img("pack"),
        110 + (F % 5) * 20,
        118,
        20,
        23,
        this.x,
        this.y,
        23,
        26,
    );
}

NPC_estatico.prototype.renderHeart = function (dt) {

    this.frame += 50 * dt;
    var F = Math.floor(this.frame);
    this.ctx.drawImage(
        this.assets.img("pack"),
        164,
        0,
        32,
        32,
        this.x,
        this.y,
        this.w,
        this.h,
    );
}

NPC_estatico.prototype.colidiuCom = function (alvo) {
    // + e - numeros para dar uma margem a mais para colisão
    if (alvo.x + alvo.w - 5 < this.x) return false;
    if (alvo.x + 5 > this.x + this.w) return false;
    if (alvo.y + alvo.h - 2 < this.y) return false;
    if (alvo.y + 8 > this.y + this.h) return false;

    return true;
}

