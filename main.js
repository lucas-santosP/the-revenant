const cnv = document.querySelector("canvas");
cnv.width = 960;
cnv.height = 704;
const ctx = cnv.getContext("2d");
var teclas = {
  esquerda: false,
  cima: false,
  direita: false,
  baixo: false,
};
var espaco = false;
var enter = false;
var esc = false;
var assetsMng = new AssetsManager();
assetsMng.loadImage("chao_inicial", "assets/imgs/chao1.png");
assetsMng.loadImage("chao_final", "assets/imgs/chao2.png");
assetsMng.loadImage("background", "assets/imgs/background-2.png");
assetsMng.loadImage("pack", "assets/imgs/all_imgs.png");
assetsMng.loadImage("menu-select", "assets/imgs/menu-select.png");
assetsMng.loadImage("menu-noSelect", "assets/imgs/menu-noSelect2.png");
assetsMng.loadImage("hud-pontos", "assets/imgs/hud-pontos.png");
assetsMng.loadImage("tuto-text", "assets/imgs/texto.png");
//audios
assetsMng.loadAudio("pickSound", "assets/sounds/pick.mp3");
assetsMng.loadAudio("hitSound", "assets/sounds/death-sound-effect.mp3");
assetsMng.loadAudio("checkSound", "assets/sounds/checkpointSound.mp3");
assetsMng.loadAudio("soundTrack", "assets/sounds/OST-menor.mp3");
assetsMng.loadAudio("soundGameOver", "assets/sounds/Game-Over.mp3");
assetsMng.loadAudio("soundWin", "assets/sounds/win.mp3");
assetsMng.loadAudio("select-sound", "assets/sounds/select-sound.mp3");

var cellSize = 32;
var mapa = new Map({
  COLUMNS: 30,
  LINES: 22,
  SIZE: cellSize,
  assets: assetsMng,
  ctx: ctx,
  m: addFases(),
});

function addFases() {
  return [...stages];
}

var pc = new Sprite({
  x: 32 + 8,
  y: 32,
  assets: assetsMng,
  mapa: mapa,
  ctx: ctx,
});
var explosao = new NPC_estatico({ assets: assetsMng, mapa: mapa, ctx: ctx });
//Variaveis do game
var game_state;
var alive, hit;
var faseAtual = 0;
var dt = 0,
  anterior = 0;
var vidas, pontos, totalPontos;
var cooldown = 0.5,
  cooldown_menu = 0.5;
//Posição do respawn do pc
var posicao_x = 1 * cellSize;
var posicao_y = 1 * cellSize;
//Variaveis do Menu
var cor_play;
var cor_tutorial;
var estado_menu;
var selecter = new NPC({ assets: this.assets, mapa: this, ctx: this.ctx });

//MAIN ================================================================================================
inicio();

//FUNÇÕES PRINCIPAIS ==================================================================================
function loop(t) {
  dt = (t - anterior) / 1000;
  anterior = t;

  switch (game_state) {
    case "menu":
      desenha_menu_inicial();
      break;

    case "tutorial":
      if (!hit) {
        update(dt);
        render();
        pontos = pc.caminhos.length; //Atualiza os pontos
      } else {
        render();
        hited(); //Desenha e toca som do hit

        cooldown = cooldown - 0.3 * dt;
        if (cooldown <= 0) {
          assetsMng.PauseOST("hitSound");
          cooldown = 0.5;
          vidas--;
          if (vidas == 0) {
            vidas = 3;
          }
          respawn(); //Volta hit para false
        }
      }
      desenhaHUD();
      desenha_menu_tutorial();
      break;

    case "playing":
      if (!hit) {
        update(dt);
        render();
        pontos = pc.caminhos.length; //Atualiza os pontos
        if (pontos == mapa.totalPts) {
          //Se coletou todos os pontos
          cooldown = cooldown - 0.5 * dt;
          if (cooldown <= 0) {
            cooldown = 0.5;
            faseAtual++;
            game_state = "win";
          }
        }
      } else {
        render();
        hited(); //Desenha e toca som do hit

        cooldown = cooldown - 0.3 * dt;
        if (cooldown <= 0) {
          assetsMng.PauseOST("hitSound");
          cooldown = 0.5;
          vidas--;
          //desenhaHUD();
          if (vidas == 0) {
            game_state = "gameOver";
          }
          respawn(); //Volta hit para false
        }
      }
      desenhaHUD();
      break;
    case "gameOver":
      gameOver();
      break;
    case "win":
      venceu();
      break;

    default:
      break;
  }

  //desenha FPS
  ctx.fillStyle = "white";
  ctx.font = "18px verdana";
  ctx.fillText(Math.floor(1 / dt), cnv.width - 28, cnv.height - 5);
  requestAnimationFrame(loop);
}

function update() {
  if (!hit) {
    //Somente mover quando terminar a animação de morte.
  }

  pc.mover(teclas); //move Sprite

  //Chama função para decidir qual quarto do mapa vai verificar a colisão com base na posição atual do pc
  colisãoComParedes();

  for (const i in mapa.spikes) {
    //colisão da spikes estatica
    if (mapa.spikes[i].SpikeColidiuCom(pc)) {
      hit = true;
    }
  }
  for (const i in mapa.serrasLineares) {
    //Movimento e colisão da serra
    mapa.serrasLineares[i].mover();
    if (mapa.serrasLineares[i].colidiuCom(pc)) {
      hit = true;
    }
  }
  for (const i in mapa.serrasCirculares) {
    //Movimento e colisão da serra circular
    mapa.serrasCirculares[i].moverCircular();
    if (mapa.serrasCirculares[i].colidiuCom(pc)) {
      hit = true;
    }
  }

  for (const i in mapa.coracoes) {
    //Colisão com corações
    if (mapa.coracoes[i].ativo) {
      if (mapa.coracoes[i].colidiuCom(pc)) {
        //mapa.coracoes.splice(i, 1);
        assetsMng.playSoundEffect("pickSound", 1, false);
        mapa.coracoes[i].ativo = false;
        if (vidas < 3) vidas++;
        break;
      }
    }
  }
  for (const i in mapa.checkPoints) {
    //Colisão com checkpoint
    if (mapa.checkPoints[i].colidiuCom(pc)) {
      if (!mapa.checkPoints[i].ativo) {
        assetsMng.playSoundEffect("checkSound", 0.3, false);
      }
      mapa.checkPoints[i].ativo = true;
      posicao_y = mapa.checkPoints[i].y;
      posicao_x = mapa.checkPoints[i].x;
    }
  }
}

function render() {
  ctx.clearRect(0, 0, cnv.width, cnv.height);
  mapa.render();

  for (const i in mapa.checkPoints) {
    //Desenha mapa.checkPoints
    mapa.checkPoints[i].renderCheck(dt);
  }
  for (const i in mapa.coracoes) {
    //Desenha corações
    if (mapa.coracoes[i].ativo) {
      mapa.coracoes[i].renderHeart(dt);
    }
  }
  for (const i in mapa.serrasLineares) {
    //Desenha serras
    mapa.serrasLineares[i].render(dt);
  }
  for (const i in mapa.serrasCirculares) {
    //Desenha serras circulares
    mapa.serrasCirculares[i].render(dt);
  }
  if (!hit) {
    pc.render(dt);
  }
}

function colisãoComParedes() {
  // intersecção
  if (pc.mc >= 15 && pc.mc <= 16) {
    for (const i in mapa.wallsLeft) {
      const colidiu = pc.colisaoMap(mapa.wallsLeft[i]);
      if (colidiu) return;
    }
    for (const i in mapa.wallsRight) {
      const colidiu = pc.colisaoMap(mapa.wallsRight[i]);
      if (colidiu) return;
    }
  } else if (pc.mc < 16) {
    for (const i in mapa.wallsLeft) {
      const colidiu = pc.colisaoMap(mapa.wallsLeft[i]);
      if (colidiu) return;
    }
  } else {
    for (const i in mapa.wallsRight) {
      const colidiu = pc.colisaoMap(mapa.wallsRight[i]);
      if (colidiu) return;
    }
  }
}

//MENUS ========================================================================
function restart_menu() {
  cooldown_menu = 0.5;
  cor_play = "white";
  cor_tutorial = "black";
  estado_menu = "selecting";
  selecter.x = cnv.width / 2 - 155;
  selecter.y = 500;
}
function desenha_menu_inicial() {
  ctx.drawImage(assetsMng.img("background"), 0, 0, cnv.width, cnv.height);

  switch (estado_menu) {
    case "play":
      restart(); //Inicializa variaveis
      assetsMng.PlayOST("soundTrack", 0.1, true);
      faseAtual = 1;
      mapa.setFase(faseAtual);
      game_state = "playing";
      break;
    case "tutorial":
      restart(); //Inicializa variaveis
      assetsMng.PlayOST("soundTrack", 0.1, true);
      faseAtual = 0;
      mapa.setFase(faseAtual);
      game_state = "tutorial";
      break;
    case "selecting":
      estado_menu = menu_selector();
      break;
    default:
      break;
  }
}
function menu_selector() {
  if (teclas.baixo) {
    assetsMng.playSoundEffect("select-sound", 0.1, false);
    selecter.moverMenu("+");
    cor_play = "black";
    cor_tutorial = "white";
  } else if (teclas.cima) {
    assetsMng.playSoundEffect("select-sound", 0.1, false);
    selecter.moverMenu("-");
    cor_play = "white";
    cor_tutorial = "black";
  }
  ctx.drawImage(assetsMng.img("menu-noSelect"), cnv.width / 2 - 155, 500, 300, 60);
  ctx.drawImage(assetsMng.img("menu-noSelect"), cnv.width / 2 - 155, 600, 300, 60);
  selecter.desenharMenu();
  ctx.font = "30px arial";
  ctx.fillStyle = cor_play;
  ctx.fillText("PLAY", cnv.width / 2 - 45, 540);
  ctx.fillStyle = cor_tutorial;
  ctx.fillText("TUTORIAL", cnv.width / 2 - 85, 640);

  cooldown_menu = cooldown_menu - 1.2 * dt;
  if (cooldown_menu <= 0) {
    if (enter) {
      cooldown_menu = 0.5;
      if (selecter.y == 500) {
        console.log("returning: play");
        return "play";
      } else {
        console.log("returning: tutorial");
        return "tutorial";
      }
    }
  }
  return "selecting";
}

function desenha_menu_tutorial() {
  ctx.fillStyle = "white";
  ctx.drawImage(assetsMng.img("menu-select"), cnv.width / 2 - 150, 635, 300, 60);
  ctx.font = "30px arial";
  ctx.fillText("Voltar", cnv.width / 2 - 40, 675);

  ctx.drawImage(assetsMng.img("tuto-text"), cnv.width / 2 - 400, 380, 800, 250);

  cooldown_menu = cooldown_menu - 1.2 * dt;
  if (cooldown_menu <= 0) {
    if (enter) {
      cooldown_menu = 0.5;
      restart_menu();
      assetsMng.PauseOST("soundTrack");
      game_state = "menu";
    }
  }
}

//OUTRAS FUNÇÕES ===============================================================
function hited() {
  //Atualiza posição da animação de morte
  explosao.x = pc.x;
  explosao.y = pc.y;
  assetsMng.PlayOST("hitSound", 0.1, false);
  explosao.renderDeath(dt);
}
function respawn() {
  hit = false;
  pc.x = posicao_x;
  pc.y = posicao_y;
}
function restart() {
  //Volta todas variaveis (necessarias) para o estado inicial do jogo.
  vidas = 3;
  mapa.m = addFases(); //Retorna o modelo inicial de fase
  mapa.setFase(faseAtual); //Altera a fase
  pontos = 0;

  //mapa.clearMap(pc.caminhos);//Apaga o caminho colorido pelo jogador
  pc.caminhos.length = 0;
  mapa.respawnNPCs(); //Volta as condições "ativo" do checkpoint e corações
  //Volta a posição do respawn pro inicio do mapa, e chama o respawn
  posicao_x = 38;
  posicao_y = 32;
  respawn();
}

function gameOver() {
  assetsMng.PlayOST("soundGameOver", 0.1, false);
  assetsMng.PauseOST("soundTrack");

  ctx.globalAlpha = 0.2;
  ctx.fillStyle = "black";
  ctx.fillRect(32, 32, cnv.width - 64, cnv.height - 64);

  ctx.globalAlpha = 1.0;
  ctx.fillStyle = "darkred";
  ctx.font = "100px bold sans-serif";
  ctx.fillText("GAME OVER", cnv.width / 2 - 300, cnv.height / 2 - 30);

  ctx.font = "30px bold roboto";
  ctx.lineWidth = 2;
  ctx.strokeStyle = "white";
  ctx.fillStyle = "red";
  ctx.fillRect(cnv.width / 2 - 110, cnv.height / 2 + 60, 200, 40);
  ctx.strokeRect(cnv.width / 2 - 110, cnv.height / 2 + 60, 200, 40);
  ctx.fillStyle = "white";
  ctx.fillText("RESTART", cnv.width / 2 - 70, cnv.height / 2 + 90);
  faseAtual = 1;

  if (enter) {
    assetsMng.PauseOST("soundGameOver");
    restart();
    estado_menu = "selecting";
    game_state = "menu";
  }
}

//Se juntou todos os pontos
function venceu() {
  assetsMng.PlayOST("soundWin", 0.1, false);
  assetsMng.PauseOST("soundTrack");
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = "black";

  ctx.fillRect(0, 0, cnv.width, cnv.height);
  ctx.globalAlpha = 1.0;
  ctx.fillStyle = "white";
  ctx.font = "100px bold sans-serif";
  ctx.fillText("VOCÊ VENCEU!", cnv.width / 2 - 360, cnv.height / 2 - 30);
  ctx.font = "30px Verdana";
  ctx.fillStyle = "white";

  ctx.font = "30px bold roboto";
  ctx.lineWidth = 2;
  ctx.strokeStyle = "white";
  ctx.fillStyle = "blue";
  ctx.fillRect(cnv.width / 2 - 110, cnv.height / 2 + 60, 245, 40);
  ctx.strokeRect(cnv.width / 2 - 110, cnv.height / 2 + 60, 245, 40);
  ctx.fillStyle = "white";
  ctx.fillText("BACK TO MENU", cnv.width / 2 - 100, cnv.height / 2 + 90);

  ctx.font = "20px bold roboto";
  ctx.fillText("press enter", cnv.width / 2 - 35, cnv.height / 2 + 150);

  if (pontos != 0 && enter) {
    assetsMng.PauseOST("soundWin");
    faseAtual = 1;
    cooldown = 0.5;
    estado_menu = "selecting";
    game_state = "menu";
    restart();
  }
}

function desenhaHUD() {
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, 175, 25);

  ctx.globalAlpha = 0.7;
  ctx.fillStyle = "rgb(195, 195, 195)";
  ctx.strokeRect(0, 0, 70, 25);
  ctx.strokeRect(70, 0, 105, 25);

  ctx.globalAlpha = 1;
  ctx.drawImage(assetsMng.img("hud-pontos"), cnv.width - 110, 0, 110, 35);
  ctx.fillStyle = "white";
  ctx.font = "20px bold monospaced";
  ctx.fillText(pontos, cnv.width - 60, 25);

  var heart_Y;
  switch (vidas) {
    case 0:
      heart_Y = 0;
      break;
    case 1:
      heart_Y = 17;
      break;
    case 2:
      heart_Y = 34;
      break;
    default:
      heart_Y = 51;
      break;
  }
  ctx.drawImage(assetsMng.img("pack"), 110, heart_Y, 54, 17, 5, 4, 54, 17);
}

function inicio() {
  game_state = "menu";
  restart_menu();
  requestAnimationFrame(loop);
}

let stackKeysDown = [];

//CONTROLES
window.addEventListener("keydown", function (e) {
  switch (e.keyCode) {
    case 37:
      teclas.esquerda = true;
      stackKeysDown = Array.from(new Set([...stackKeysDown, "esquerda"]));
      teclas.direita = false;
      teclas.baixo = false;
      teclas.cima = false;
      break;
    case 38:
      teclas.cima = true;
      stackKeysDown = Array.from(new Set([...stackKeysDown, "cima"]));
      teclas.direita = false;
      teclas.esquerda = false;
      teclas.baixo = false;
      break;
    case 39:
      teclas.direita = true;
      stackKeysDown = Array.from(new Set([...stackKeysDown, "direita"]));
      teclas.esquerda = false;
      teclas.cima = false;
      teclas.baixo = false;
      break;
    case 40:
      teclas.baixo = true;
      stackKeysDown = Array.from(new Set([...stackKeysDown, "baixo"]));
      teclas.direita = false;
      teclas.esquerda = false;
      teclas.cima = false;
      break;
    case 37:
      espaco = true;
      break;
    case 13:
      enter = true;
      break;
    case 27:
      esc = true;
      break;
    default:
      break;
  }
});

window.addEventListener("keyup", function (e) {
  switch (e.keyCode) {
    case 37:
      teclas.esquerda = false;
      stackKeysDown = stackKeysDown.filter((k) => k !== "esquerda");
      teclas[stackKeysDown[stackKeysDown.length - 1]] = true;

      break;
    case 38:
      teclas.cima = false;
      stackKeysDown = stackKeysDown.filter((k) => k !== "cima");
      teclas[stackKeysDown[stackKeysDown.length - 1]] = true;

      break;
    case 39:
      teclas.direita = false;
      stackKeysDown = stackKeysDown.filter((k) => k !== "direita");
      teclas[stackKeysDown[stackKeysDown.length - 1]] = true;

      break;
    case 40:
      teclas.baixo = false;
      stackKeysDown = stackKeysDown.filter((k) => k !== "baixo");
      teclas[stackKeysDown[stackKeysDown.length - 1]] = true;

      break;
    case 37:
      espaco = false;
      break;
    case 13:
      enter = false;
      break;
    case 27:
      esc = false;
      break;
    default:
      break;
  }
});
