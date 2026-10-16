#!/bin/bash
# Assemble Uncle Moon trial Ep1: segments -> VO mux -> concat -> bed mix -> fades
set -e
MP=/home/hatch/workspace/kids-pipeline-demo/moon-prototype
VO=/home/hatch/workspace/kids-pipeline-demo/build/ep1_trial_vo
FR=$MP/ep1_frames
ASM=$MP/ep1_assemble
BED=/home/hatch/workspace/kids-pipeline-demo/build/soundtrack.wav
OUT=/home/hatch/workspace/your_files/kids-demo/uncle_moon_ep1_trial.mp4
mkdir -p "$ASM"
cd "$ASM"

declare -A HTML=( [s1]=ep1_s1_greeting.html [s2]=ep1_s2_meadow.html [s3]=ep1_s3_worry.html
  [s4]=ep1_s4_bird.html [s5]=ep1_s5_turtle.html [s6]=ep1_s6_dim.html
  [s7]=ep1_s7_glowback.html [s8]=ep1_s8_ritual.html [s9]=ep1_s9_tease.html )
declare -A VOF=( [s1]=s1_greeting [s2]=s2_meadow [s3]=s3_worry [s4]=s4_bird [s5]=s5_turtle
  [s6]=s6_dim [s7]=s7_glowback [s8]=s8_ritual [s9]=s9_tease )
ORDER="s1 s2 s3 s4 s5 s6 s7 s8 s9"

> concat_list.txt
for s in $ORDER; do
  echo "--- $s: video segment"
  ffmpeg -y -v error -framerate 24 -i "$FR/$s/f%04d.png" \
    -c:v libx264 -pix_fmt yuv420p -color_range 1 -colorspace bt709 -crf 20 "$s.mp4"
  echo "--- $s: mux VO"
  ffmpeg -y -v error -i "$s.mp4" -i "$VO/${VOF[$s]}.mp3" \
    -c:v copy -c:a aac -b:a 128k -shortest "${s}_av.mp4"
  echo "file '${s}_av.mp4'" >> concat_list.txt
done

echo "--- concat"
ffmpeg -y -v error -f concat -safe 0 -i concat_list.txt -c copy ep1_raw.mp4
TOTAL=$(ffprobe -v error -show_entries format=duration -of csv=p=0 ep1_raw.mp3 2>/dev/null || \
        ffprobe -v error -show_entries format=duration -of csv=p=0 ep1_raw.mp4)
echo "total duration: ${TOTAL}s"

echo "--- bed loop + mix + fades"
ffmpeg -y -v error -stream_loop 4 -i "$BED" -t "$TOTAL" -filter:a "volume=0.10" bed_loop.wav
FADEOUT_START=$(python3 -c "print(round(float('$TOTAL')-1.5, 2))")
ffmpeg -y -v error -i ep1_raw.mp4 -i bed_loop.wav -filter_complex \
  "[1:a]volume=0.10[bed];[0:a][bed]amix=inputs=2:duration=first:dropout_transition=0,afade=t=out:st=${FADEOUT_START}:d=1.5[a]" \
  -map 0:v -map "[a]" \
  -vf "fade=t=in:st=0:d=0.8,fade=t=out:st=${FADEOUT_START}:d=1.5" \
  -c:v libx264 -pix_fmt yuv420p -color_range 1 -colorspace bt709 -crf 20 \
  -c:a aac -b:a 128k -movflags +faststart -shortest "$OUT"
echo "DONE: $OUT"
ffprobe -v error -show_entries format=duration,size -of default=noprint_wrappers=1 "$OUT"
