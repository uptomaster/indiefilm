// components/HexagonChart.tsx
"use client";

import { useMemo } from "react";

interface HexagonChartProps {
  traits: {
    acting: number; // 연기력
    appearance: number; // 외모
    charisma: number; // 카리스마
    emotion: number; // 감성
    humor: number; // 유머
    action: number; // 액션
  };
  size?: number;
  className?: string;
}

const traitLabels = {
  acting: "연기력",
  appearance: "외모",
  charisma: "카리스마",
  emotion: "감성",
  humor: "유머",
  action: "액션",
};

export function HexagonChart({ traits, size = 200, className = "" }: HexagonChartProps) {
  // 패딩을 고려한 중심점 계산 (레이블이 잘리지 않도록 충분한 패딩)
  const padding = 80;
  const svgSize = size + padding * 2;
  const center = svgSize / 2;
  const radius = size * 0.35;

  // 6개 꼭짓점의 각도 (시작점: 위쪽, 시계방향)
  const angles = [0, 60, 120, 180, 240, 300].map((deg) => (deg - 90) * (Math.PI / 180));

  // 각 특성의 점 좌표 계산
  const points = useMemo(() => {
    const traitValues = [
      traits.acting,
      traits.appearance,
      traits.charisma,
      traits.emotion,
      traits.humor,
      traits.action,
    ];

    return traitValues.map((value, index) => {
      const angle = angles[index];
      const distance = radius * (value / 100);
      const x = center + distance * Math.cos(angle);
      const y = center + distance * Math.sin(angle);
      return { x, y, value };
    });
  }, [traits, center, radius, angles]);

  // SVG path 생성
  const pathData = useMemo(() => {
    return points.map((point, index) => {
      const command = index === 0 ? "M" : "L";
      return `${command} ${point.x} ${point.y}`;
    }).join(" ") + " Z";
  }, [points]);

  // 외곽 육각형 경계선
  const outerHexagon = useMemo(() => {
    return angles.map((angle, index) => {
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      const command = index === 0 ? "M" : "L";
      return `${command} ${x} ${y}`;
    }).join(" ") + " Z";
  }, [angles, center, radius]);

  // 레이블 위치 계산 (더 넓은 간격)
  const labelPositions = useMemo(() => {
    return angles.map((angle) => {
      const labelRadius = radius + 40;
      const x = center + labelRadius * Math.cos(angle);
      const y = center + labelRadius * Math.sin(angle);
      return { x, y };
    });
  }, [angles, center, radius]);

  const traitKeys: (keyof typeof traits)[] = [
    "acting",
    "appearance",
    "charisma",
    "emotion",
    "humor",
    "action",
  ];

  return (
    <div className={`relative ${className}`} style={{ width: svgSize, height: svgSize }}>
      <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`}>
        {/* 배경 원 */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255, 215, 0, 0.1)"
          strokeWidth="1"
        />

        {/* 격자선 (20%, 40%, 60%, 80%, 100%) */}
        {[20, 40, 60, 80, 100].map((percent) => {
          const gridRadius = radius * (percent / 100);
          const gridHexagon = angles.map((angle, index) => {
            const x = center + gridRadius * Math.cos(angle);
            const y = center + gridRadius * Math.sin(angle);
            const command = index === 0 ? "M" : "L";
            return `${command} ${x} ${y}`;
          }).join(" ") + " Z";
          return (
            <path
              key={percent}
              d={gridHexagon}
              fill="none"
              stroke="rgba(255, 215, 0, 0.15)"
              strokeWidth="0.5"
            />
          );
        })}

        {/* 외곽 육각형 */}
        <path
          d={outerHexagon}
          fill="none"
          stroke="rgba(255, 215, 0, 0.3)"
          strokeWidth="2"
        />

        {/* 특성 영역 (그라데이션) */}
        <defs>
          <linearGradient id="traitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 215, 0, 0.4)" />
            <stop offset="100%" stopColor="rgba(255, 215, 0, 0.6)" />
          </linearGradient>
        </defs>
        <path
          d={pathData}
          fill="url(#traitGradient)"
          stroke="rgba(255, 215, 0, 0.8)"
          strokeWidth="2"
          opacity="0.7"
        />

        {/* 특성 점 */}
        {points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#FFD700"
            stroke="#FFA500"
            strokeWidth="1.5"
          />
        ))}

        {/* 레이블 */}
        {labelPositions.map((pos, index) => {
          const traitKey = traitKeys[index];
          const value = traits[traitKey];
          return (
            <g key={index}>
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-violet-400 text-xs font-semibold"
                fontSize="12"
              >
                {traitLabels[traitKey]}
              </text>
              <text
                x={pos.x}
                y={pos.y + 16}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-violet-500 text-xs"
                fontSize="10"
              >
                {value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
