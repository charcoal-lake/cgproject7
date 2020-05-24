// 편의상 보드의 인덱스를 1 부터 시작. 좌측 최상단 좌표는 (1,1), 우측 최하단 좌표는 (board_size, board_size)

/*
게임판 관련 변수 (board)
보드에 접근   : board[y][x]. (x, y 가 아닌 y, x 임에 주의!)

보드의 칸의 ownership 은 숫자로 대표되도록 함. 예를 들어서 (i, j) 좌표의 보드의 owner 가 player1 이라면 board[j][i] = 1;
owner 가 없을 경우 board[i][j] = 0; (default)

<모듈>
display_board() : 보드를 화면에 표시, ownership 에 따라 다른 색 또는 건물로 각 cell 이 나타나야 함.

*/
let board = [];       // 게임판
let board_size = 10;  // default size, 게임판 기본 크기
let cell_size = 50;   // 셀 하나 가로 크기
let test_commit;


/*
플레이어 오브젝트 => class Marker
플레이어 배열 => player
플레이어 점수판 => player_score

플레이어 선택은 index를 사용하도록 함.
예를 들어서 player1 은 player[1], player2 는 player[2].
player[0] 는 만일의 목적을 위해 만들고 비워두도록 할게요!

플레이어 점수판 참조 역시 index 를 사용.
예를 들어서 player1 의 점수는 player_score[1].
점수판에는 플레이어가 차지한 칸의 갯수가 기록됨.
score 값에 따라 승리 여부 결정.

플레이어 색상 참조 역시 index 사용.
예를 들어서 player1 의 색상은 player_color[1].
player1 에 의해 차지된 보드는 display_board 에서 player_color[1] 의 색상으로 표시됨.

<모듈>
move() : key input 에 따라 player를 움직임
display() : 움직인 player 를 화면에 그림.
...

*/
let player_num = 2;
let player = [];
let player_score = [];
let turn =1; // 플레이어 턴 default : player 1 부터 시작
let player_color = [];
let player_cam_pos;  // turn 에 따른 카메라 position. (optional)
let player_cam_view;  // turn 에 따른 카메라 center. (optional)
let player_move_cnt;

/*
주사위 관련 변수 (dice)
*/
let dice=0;             // 1~6, roll_dice 결과값
let dice_button;      // 테스트 버튼. dice_button 을 누르면 roll_dice 가 실행된다고 가정합니다.

let dice_side = [];   // 주사위 6면 텍스쳐
let dice_rot_x = 0;
let dice_rot_y = 0;
let dice_rot_z = 0;
let dice_pos_x =0;
let dice_pos_y =0;

/* 주사위 관련 추가변수 */ //김호진
let dice_isNew = false;  //dice값을 새로 갱신해야 하는지 판단하는 bool값
let display_diceValue;   //화면에 실제로 보여지는 dice값
let dice_usedFrame;      //주사위를 굴린 시점 프레임값(쿨타임 계산시 사용)

/*
게임 오버 관련
*/
let game_over = false;  // game_over flag. 만약 보드 전체가 ownership 을 갖게 되면 game_over = true;

/* 게임 오버 관련 추가변수 */ //김호진
let winner_num;

/*
화면 rotation slider, display 함수 등 visual 만들때 사용하세요
*/
let rotX, rotY, rotZ;

/*
UI 관련 변수 / 최예린
*/
let ui_title;
let ui_desc;
let ui_current_dice;
let ui_player_move_cnt;
let ui_player1_score;
let ui_player2_score;

/*
카메라 관련 변수 / 강성훈
*/
let key_turn = -1;
let cam_up = -1;


function preload(){
  // 나중에 모델 로드, 텍스처 로드


  player_model = loadModel('assets/marker.obj')
  dice_model = loadModel('assets/dice.obj')
  dice_texture = loadImage('assets/dice.png')

  for(let i=1; i<=6; i++)
    dice_side[i] = loadImage('assets/dice'+i+'.png');
}

function setup(){

  cnv = createCanvas(windowWidth-300, windowHeight, WEBGL);
  cnv.position(299,0);

  // board 2차원 배열 생성
  for(let i=1; i<=board_size; i++){
        board[i] = [];
        for(let j=1; j<=board_size; j++){
          // (j, i) 번째 칸 생성*
          // owner 가 없는 칸으로 초기화
          board[i][j] = 0;
        }
  }

  player[0] = new Marker(0, 0, 0);  // 임시 플레이어
  player[1] = new Marker(1, 1, 1);  // player1, default position (1, 1)
  player[2] = new Marker(2, board_size, board_size); // player 2, default position (10, 10)

  player_color[0] = color('white');
  player_color[1] = color('red');
  player_color[2] = color(1, 130, 150);

  // sliders
  rotX = createSlider(0, 180, 0);
  rotY = createSlider(0, 180, 0);
  rotZ = createSlider(0, 180, 0);
  rotX.position(50,50);
  rotY.position(50,80);
  rotZ.position(50,110);

  dice_button = createButton('roll');
  dice_button.mousePressed(roll_dice);
  dice_button.position(50, 140);

  board[player[1].y][player[1].x] = player[1].n;  // 플레이어1 시작 칸 차지
  board[player[2].y][player[2].x] = player[2].n;  // 플레이어2 시작 칸 차지

  for(i=0; i<=player_num; i++)  player_score[i] = 0; // 점수 초기화

  createUI();

  player_cam_pos = new p5.Vector();
  player_cam_pos.x = 0;
  player_cam_pos.y = -850;
  player_cam_pos.z = 400;
  player_cam_view = new p5.Vector();
  player_cam_view.x = 0;
  player_cam_view.y = 0;
  player_cam_view.z = 0;
  updateCam();    //카메라 설정
}


function draw(){
  background(200);

  camera(player_cam_pos.x, player_cam_pos.y, player_cam_pos.z, player_cam_view.x, player_cam_view.y, player_cam_view.z, 0, cam_up, 0);
  updateCam();

  rotateX(radians(rotX.value()));
  rotateY(radians(rotY.value()));
  rotateZ(radians(rotZ.value()));

  if(!game_over){


    /*
    //directionalLight(250, 250, 250, 0, 0, -1);
    for(let i=1; i<=player_num; i++){
      spotLight(250,250,250, player[i].x,player[i].y,200, player[i].x,player[i].y,-200, 120);
    }
    */

   // directionalLight(250, 250, 250, 0, 0, -1);

    animate_dice();
    for(let i=1; i<=player_num; i++){
      if(i == turn){
        spotLight(250,250,250, -board_size*cell_size/2+(player[i].x-1)*cell_size,-board_size*cell_size/2+(player[i].y-1)*cell_size,500, 0, 0,-10);
        directionalLight(160-i*20, 120, 100+i*20, 0, 1, -1);
      } else{
        spotLight(100,100,100, -board_size*cell_size/2+(player[i].x-1)*cell_size,-board_size*cell_size/2+(player[i].y-1)*cell_size,500, 0, 0,-10);
      }

    }
    display_dice();
    display_board();
    

    for(let i=1; i<=player_num; i++){
      player[i].display();
    }

    plane(1000, 1000);
    check_gameover();
  }

  else{
    displayWinner();
  }


} // end of draw


function display_board(){

  // 보드를 화면에 표시
  // 위치를 잡고, 보드 배열의 값에 따라(owner에 따라) 색이 바뀌거나 모델이 나타남.

    for(let i=1; i<= board_size; i++){
      for(let j=1; j<=board_size; j++){
        push();
        translate(-board_size*cell_size/2+(i-1)*cell_size, -board_size*cell_size/2+(j-1)*cell_size,  cell_size/2);
        fill(player_color[board[j][i]]);
        box(cell_size, cell_size, cell_size);
        pop();
      }
    }

 } // end of display_board



 function roll_dice(){

  if(!dice_isNew){
  dice = int(random(6)) + 1;
  //dice_usedFrame = frameCount;
  
  // if(turn == 1){
  //   turn = 2;
  // } else if(turn == 2){
  //   turn = 1;
  // }
  
  dice_isNew = true;
  player_move_cnt = dice;
  }
  
  
  // 주사위를 굴림
  // 굴린 주사위 값이 dice_value 에 저장
  // 주사위를 굴릴 때마다 턴이 바뀜. player1 => player2 => player1 ...
} // end of roll_dice

function display_dice(){
  if(dice_isNew) {
    display_diceValue = dice;
    print("current dice:"+str(display_diceValue)+" / current turn:"+str(turn));  //디버그용
    ui_current_dice.html("current dice:"+str(display_diceValue)+" / current turn:"+str(turn));
    
    if(player_move_cnt == 0){
      dice_isNew = false;

      if(turn == 1){
        turn = 2;
      } else if(turn == 2){
        turn = 1;
      }
    }
  }
  /*else {
    if(frameCount % 6 == 0) {
      display_diceValue = int(random(6)) + 1;
      // print(display_diceValue); // 디버그용
    }
  }*/


  // 주사위를 화면에 표시
} // end of display_dice

function animate_dice(){

  push();
  translate(-board_size*cell_size/2+(player[turn].x-1)*cell_size, -board_size*cell_size/2+(player[turn].y-1)*cell_size,  130);
  if(!dice_isNew){
    dice_rot_x+=0.1;
    dice_rot_y+=0.1;
  }

  noStroke();

  rotateX(dice_rot_x);
  rotateY(dice_rot_y);
  textureMode(NORMAL);


  push();
  translate(0, 0, -15);
  if(dice == 1 && dice_isNew) tint(color('yellow'));
  else tint(color('white'));
  texture(dice_side[1]);
  plane(30, 30);
  
  //side2, 5
  push();
  rotateY(PI/2);
  translate(-15, 0, -15);
  if(dice == 2 && dice_isNew) tint(color('yellow'));
  else tint(color('white'));
  texture(dice_side[2]);
  plane(30, 30);
  translate(0, 0, 30);
  if(dice == 5 && dice_isNew)  tint(color('yellow'));
  else tint(color('white'));
  texture(dice_side[5]);
  plane(30, 30);
  pop();

  // side3, 4
  push();
  rotateX(PI/2);
  translate(0, 15, -15);
  if(dice == 3 && dice_isNew) tint(color('yellow'));
  else tint(color('white'));
  texture(dice_side[3]);
  plane(30, 30);
  translate(0, 0, 30);
  if(dice == 4&& dice_isNew) tint(color('yellow'));
  else tint(color('white'));
  texture(dice_side[4]);
  plane(30, 30);
  pop();


  // side6
  push();
  translate(0, 0, 30);
  if(dice == 6&& dice_isNew) tint(color('yellow'));
  else tint(color('white'));
  texture(dice_side[6]);
  plane(30,30);
  pop();

  translate(0, 0, -30);
  pop();
  // textureWrap(REPEAT);
  // texture(dice_texture);
  // box(30);
  pop();

}

function check_gameover(){
  for(let i=1; i<=player_num; i++){

      if(player_score[i] >= 10){
      if(player_score[i] >= 25){
        winnerNum = i;
        game_over = true;
      }
    }
  // 게임오버인지 체크
  // 만약 게임오버 조건을 만족하게 되면 game_over = true; 로 바꾸어 줍니다.
  }
}



class Marker{

  constructor(n, x, y){
    // n : player number
    // x, y :default position
    this.n = n;
    this.x = x;
    this.y = y;
  }

  move(x, y){
    // key input 에 따라 Marker 의 좌표값을 바꿈
    // 바뀐 좌표상의 board 의 ownership 을 바꿈
    // player_score 를 업데이트 함. (만약 player1 이 player2 의 칸을 먹었다면 두 플레이어의 스코어가 모두 변해야 해요!)
    // player 가 dice 만큼 움직였다면 다음 플레이어로 넘어감 (turn)
    // 아무거나
    if(player_move_cnt > 0){
      if((this.x+x >=1 && this.x+x <=board_size) && (this.y+y >=1 && this.y+y <= board_size)) {
        // 플레이어가 같은 cell에 있을 수 없음

        this.x += x;
        this.y += y;
        player_move_cnt--;
        let prev = board[this.y][this.x];
        board[this.y][this.x] = this.n;

        if(prev != this.n) {
         player_score[this.n]++;
         player_score[prev]--;
         ui_player1_score.html('<b>Score</b> Player1 : ' + player_score[1]);
         ui_player2_score.html('<b>Score</b> Player2 : ' + player_score[2]);
         ui_player_move_cnt.html('Player Move :' + player_move_cnt);
        }
        print(player_score);
      }
    }
    else{
    }
  }

  display(){
    // Marker 를 보드 위에 표시.
    // 처음에는 sphere 같은 것으로 하고 나중에 model 씌우면 될 것 같습니다.
    push();
    translate(-board_size*cell_size/2+(this.x-1)*cell_size, -board_size*cell_size/2+(this.y-1)*cell_size,  cell_size);
   //sphere(30);
   rotateX(PI/2);
   scale(14);
   noStroke();
   fill(player_color[this.n]);
   model(player_model);
   pop();
  }

}

function keyPressed(){

  if(turn == 1){
    key_turn = -1;
  }
  else if(turn == 2){
    key_turn = 1
  }

  if(key == 'w' || key == 'W'){ // UP
    player[turn].move(0, -key_turn);
  }
  else if (key == 's' || key == 'S'){ // DOWN
    player[turn].move(0, key_turn);
  }
  else if (key == 'a' || key == 'A'){ // LEFT
    player[turn].move(-key_turn, 0);
  }
  else if (key == 'd' || key == 'D'){ // RIGHT
    player[turn].move(key_turn, 0);
  }
}

function updateCam(){

  if(turn == 1){
    player_cam_pos.y = -550;
    player_cam_pos.z = 150;
    cam_up = -1;
  }
  else if(turn == 2){
    player_cam_pos.y = 550;
    player_cam_pos.z = 150;
    cam_up = 1;
  }
}

function createUI(){

/* 게임 종료시, 결과 표시&승자 표시 */ //김호진 //
  let ui_title = createDiv('Board Game').size(400, 10);
  ui_title.position(20, 20);
  ui_current_dice = createDiv('Current Dice : ');
  ui_current_dice.position(50, 200);
  ui_player1_score = createDiv('<b>Score</b> Player1 : ' + player_score[1]);
  ui_player2_score = createDiv('<b>Score</b> Player2 : ' + player_score[2]);
  ui_player1_score.position(50, 220);
  ui_player2_score.position(50, 240);
  ui_player_move_cnt = createDiv('Player Move :' + player_move_cnt);
  ui_player_move_cnt.position(50, 300);
  
}

/* 게임 종료시, 결과 표시&승자 표시 */ //김호진
function displayWinner(){
  let winner;
  if(winnerNum == 1){
    winner = 'Player 1!'
  }
  else if(winnerNum == 2){
    winner = 'Player 2!'
  }
  ui_gameover1 = createDiv('Game over! The winner is : ' + winner).size(400, 10);
  ui_gameover1.position(windowWidth/2, windowHeight/2);
}
