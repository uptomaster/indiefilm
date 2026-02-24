"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { MovieGenre } from "@/lib/movies";
import { getActors, Actor } from "@/lib/actors";
import { uploadMovieThumbnail } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const movieSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  genre: z.enum(["drama", "comedy", "horror", "romance", "etc"], {
    message: "장르를 선택해주세요",
  }),
  status: z.enum(["production", "planned", "completed"], {
    message: "제작 상태를 선택해주세요",
  }),
  runtimeMinutes: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number({
      message: "러닝타임은 숫자로 입력해주세요",
    })
      .min(1, "러닝타임을 입력해주세요")
      .refine((val) => !isNaN(val), {
        message: "러닝타임은 숫자로 입력해주세요",
      })
  ) as unknown as z.ZodNumber,
  logline: z.string().min(1, "한 줄 요약을 입력해주세요"),
  description: z.string().min(1, "상세 설명을 입력해주세요"),
  videoPlatform: z.enum(["youtube", "vimeo"], {
    message: "영상 플랫폼을 선택해주세요",
  }),
  videoUrl: z.string().min(1, "영상 URL을 입력해주세요").url("올바른 URL 형식을 입력해주세요"),
  thumbnailUrl: z.union([
    z.string().url("올바른 URL 형식을 입력해주세요"),
    z.literal(""),
  ]).optional(),
  thumbnailPath: z.string().optional(),
  credits: z.array(
    z.object({
      role: z.string().optional(),
      name: z.string().optional(),
      profileLink: z.string().optional().refine(
        (val) => !val || val === "" || z.string().url().safeParse(val).success,
        { message: "올바른 URL 형식을 입력해주세요" }
      ).or(z.literal("")),
      actorId: z.string().optional(),
    })
  ),
  year: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number({
      message: "제작 연도는 숫자로 입력해주세요",
    })
      .optional()
      .refine((val) => val === undefined || !isNaN(val), {
        message: "제작 연도는 숫자로 입력해주세요",
      })
  ) as unknown as z.ZodOptional<z.ZodNumber>,
  tags: z.string().optional(),
});

type MovieForm = z.infer<typeof movieSchema>;

export default function NewMoviePage() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actors, setActors] = useState<Actor[]>([]);
  const [loadingActors, setLoadingActors] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MovieForm>({
    resolver: zodResolver(movieSchema),
    defaultValues: {
      credits: [{ role: "", name: "", profileLink: "", actorId: undefined }],
      videoPlatform: "youtube",
      status: "production", // 기본값: 제작중
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "credits",
  });

  useEffect(() => {
    loadActors();
  }, []);

  const loadActors = async () => {
    try {
      setLoadingActors(true);
      const { actors: actorsList } = await getActors({ limitCount: 100 });
      setActors(actorsList);
    } catch (error) {
      console.error("Error loading actors:", error);
    } finally {
      setLoadingActors(false);
    }
  };

  const videoPlatform = watch("videoPlatform");
  const thumbnailUrl = watch("thumbnailUrl");

  // 드래그 앤 드롭 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      await handleFileUpload(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }

    try {
      setUploadingThumbnail(true);
      setError(null);

      // 미리보기 생성
      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);

      // 업로드
      const { url, path } = await uploadMovieThumbnail(file, user.uid);
      setValue("thumbnailUrl", url);
      setValue("thumbnailPath", path);
    } catch (err: any) {
      console.error("썸네일 업로드 실패:", err);
      setError(err.message || "썸네일 업로드에 실패했습니다.");
      setThumbnailPreview(null);
    } finally {
      setUploadingThumbnail(false);
    }
  };

  // 제작자만 접근 가능
  if (userProfile && userProfile.role !== "filmmaker") {
    return (
      <div className="min-h-screen bg-black text-[#faf6f0]">
        <div className="container mx-auto px-4 py-20">
          <Card className="border-[#e8a020]/20 bg-[#100e0a]/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <p className="text-center text-[#f0e8d8]">영화 업로드는 제작자만 가능합니다.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: MovieForm) => {
    console.log("폼 제출 시작:", data);
    console.log("폼 에러:", errors);
    
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("Firestore에 저장 시작...");
      
      // undefined 값을 제거하는 헬퍼 함수
      const removeUndefined = (obj: any): any => {
        if (obj === null || obj === undefined) {
          return null;
        }
        if (Array.isArray(obj)) {
          return obj.map(removeUndefined).filter((item) => item !== undefined);
        }
        if (typeof obj === "object") {
          const cleaned: any = {};
          for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined) {
              cleaned[key] = removeUndefined(value);
            }
          }
          return cleaned;
        }
        return obj;
      };

      const movieData = removeUndefined({
        title: data.title,
        genre: data.genre,
        status: data.status,
        runtimeMinutes: data.runtimeMinutes,
        logline: data.logline,
        description: data.description,
        videoPlatform: data.videoPlatform,
        videoUrl: data.videoUrl,
        thumbnailUrl: data.thumbnailUrl && data.thumbnailUrl !== "" ? data.thumbnailUrl : null,
        thumbnailPath: data.thumbnailPath && data.thumbnailPath !== "" ? data.thumbnailPath : null,
        credits: data.credits
          .filter((c) => c.role && c.name)
          .map((c) => {
            const credit: any = {
              role: c.role,
              name: c.name,
            };
            if (c.profileLink && c.profileLink !== "") {
              credit.profileLink = c.profileLink;
            }
            if (c.actorId) {
              credit.actorId = c.actorId;
            }
            return credit;
          }),
        filmmakerId: user.uid,
        taggedActorIds: data.credits
          .filter((c) => c.actorId)
          .map((c) => c.actorId!)
          .filter((id, index, self) => self.indexOf(id) === index), // 중복 제거
        isPublished: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        year: data.year || null,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter((t) => t) : [],
      });

      console.log("저장할 데이터:", movieData);
      await addDoc(collection(db, "movies"), movieData);
      console.log("저장 완료!");

      router.push("/movies");
    } catch (err: any) {
      console.error("영화 업로드 에러:", err);
      setError(err.message || "영화 업로드에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0805] text-[#f0e8d8]">
      {/* 히어로 섹션 - 시네마틱한 디자인 */}
      <div className="relative overflow-hidden border-b border-[#100e0a]/30">
        {/* 배경 애니메이션 */}
        <div className="absolute inset-0">
          <div className="film-strip absolute inset-0 opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#100e0a]/5 via-transparent to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(234,179,8,0.1),transparent_70%)]" />
        </div>
        
        <div className="container relative mx-auto px-4 py-20 md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-block rounded-full bg-[#e8a020]/10 px-6 py-2 backdrop-blur-sm">
              <span className="text-sm font-medium text-[#e8a020]">NEW RELEASE</span>
            </div>
            <h1 className="mb-6 text-6xl font-bold tracking-tight md:text-7xl">
              <span className="bg-gradient-to-r from-[#e8a020] via-[#e8a020]/100 to-[#e8a020] bg-clip-text text-transparent">
                UPLOAD MOVIE
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-xl text-[#f0e8d8] md:text-2xl">
              당신의 작품을 세상에 공개하세요
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-[#100e0a]/50 px-4 py-2 backdrop-blur-sm">
                <span className="text-[#e8a020]">🎬</span>
                <span className="text-sm text-[#f0e8d8]">YouTube & Vimeo 지원</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-[#100e0a]/50 px-4 py-2 backdrop-blur-sm">
                <span className="text-[#e8a020]">📸</span>
                <span className="text-sm text-[#f0e8d8]">이미지 업로드 가능</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 폼 섹션 */}
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Card className="border-[#e8a020]/20 bg-gradient-to-br from-[#100e0a] via-[#100e0a]/90 to-black/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="border-b border-[#e8a020]/10 pb-6">
            <CardTitle className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-[#e8a020] to-[#e8a020] bg-clip-text text-transparent">
                영화 정보
              </span>
            </CardTitle>
            <CardDescription className="mt-2 text-base text-[#b8a898]">
              모든 필수 정보를 입력해주세요
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-8">
            {error && (
              <div className="mb-6 animate-in slide-in-from-top-2 rounded-lg border border-[#e8a020]/30 bg-[#100e0a]/20 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <p className="text-[#e8a020]/80">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit, (errors) => {
              console.log("폼 검증 실패:", errors);
              setError("입력값을 확인해주세요. 모든 필수 항목을 입력했는지 확인해주세요.");
            })} className="space-y-8">
              {/* 기본 정보 섹션 */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-[#e8a020]/20 pb-2">
                  <span className="text-2xl">📝</span>
                  <h2 className="text-xl font-semibold text-[#e8a020]">기본 정보</h2>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-medium text-[#f0e8d8]">
                    제목 <span className="text-[#e8a020]">*</span>
                  </Label>
                  <Input
                    id="title"
                    className="h-12 bg-[#0d0b08] border-[#e8a020]/35 text-[#faf6f0] transition-all focus:border-[#e8a020] focus:ring-2 focus:ring-[#e8a020]/20"
                    placeholder="영화 제목을 입력하세요"
                    {...register("title")}
                  />
                  {errors.title && (
                    <p className="text-sm text-[#e8a020] font-medium animate-in slide-in-from-top-1">
                      {errors.title.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="genre" className="text-base font-medium text-[#f0e8d8]">
                      장르 <span className="text-[#e8a020]">*</span>
                    </Label>
                    <Select
                      value={watch("genre") || ""}
                      onValueChange={(value) => setValue("genre", value as "drama" | "comedy" | "horror" | "romance" | "etc")}
                    >
                      <SelectTrigger className="h-12 bg-[#0d0b08] border-[#e8a020]/35 text-[#faf6f0] transition-all focus:border-[#e8a020] focus:ring-2 focus:ring-[#e8a020]/20">
                        <SelectValue placeholder="장르 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#100e0a] border-[#e8a020]/30">
                        <SelectItem value="drama" className="text-[#e8a020] hover:bg-[#e8a020]/10 focus:bg-[#e8a020]/10 cursor-pointer">🎭 드라마</SelectItem>
                        <SelectItem value="comedy" className="text-[#e8a020] hover:bg-[#e8a020]/10 focus:bg-[#e8a020]/10 cursor-pointer">😂 코미디</SelectItem>
                        <SelectItem value="horror" className="text-[#e8a020] hover:bg-[#e8a020]/10 focus:bg-[#e8a020]/10 cursor-pointer">👻 공포</SelectItem>
                        <SelectItem value="romance" className="text-[#e8a020] hover:bg-[#e8a020]/10 focus:bg-[#e8a020]/10 cursor-pointer">💕 로맨스</SelectItem>
                        <SelectItem value="etc" className="text-[#e8a020] hover:bg-[#e8a020]/10 focus:bg-[#e8a020]/10 cursor-pointer">🎬 기타</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.genre && (
                      <p className="text-sm text-[#e8a020] font-medium animate-in slide-in-from-top-1">
                        {errors.genre.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="runtimeMinutes" className="text-base font-medium text-[#f0e8d8]">
                      러닝타임 (분) <span className="text-[#e8a020]">*</span>
                    </Label>
                    <Input
                      id="runtimeMinutes"
                      type="number"
                      className="h-12 bg-[#0d0b08] border-[#e8a020]/35 text-[#faf6f0] transition-all focus:border-[#e8a020] focus:ring-2 focus:ring-[#e8a020]/20"
                      placeholder="예: 90"
                      {...register("runtimeMinutes", { valueAsNumber: true })}
                    />
                    {errors.runtimeMinutes && (
                      <p className="text-sm text-[#e8a020] font-medium animate-in slide-in-from-top-1">
                        {errors.runtimeMinutes.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-base font-medium text-[#f0e8d8]">
                      제작 상태 <span className="text-[#e8a020]">*</span>
                    </Label>
                    <Select
                      value={watch("status") || ""}
                      onValueChange={(value) => setValue("status", value as "production" | "planned" | "completed")}
                    >
                      <SelectTrigger className="h-12 bg-[#0d0b08] border-[#e8a020]/35 text-[#faf6f0] transition-all focus:border-[#e8a020] focus:ring-2 focus:ring-[#e8a020]/20">
                        <SelectValue placeholder="제작 상태 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#100e0a] border-[#e8a020]/30">
                        <SelectItem value="production" className="text-[#e8a020] hover:bg-[#e8a020]/10 focus:bg-[#e8a020]/10 cursor-pointer">🎬 제작중</SelectItem>
                        <SelectItem value="planned" className="text-[#e8a020] hover:bg-[#e8a020]/10 focus:bg-[#e8a020]/10 cursor-pointer">📅 제작예정</SelectItem>
                        <SelectItem value="completed" className="text-[#e8a020] hover:bg-[#e8a020]/10 focus:bg-[#e8a020]/10 cursor-pointer">✅ 제작완료</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && (
                      <p className="text-sm text-[#e8a020] font-medium animate-in slide-in-from-top-1">
                        {errors.status.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="logline" className="text-base font-medium text-[#f0e8d8]">
                    한 줄 요약 <span className="text-[#e8a020]">*</span>
                  </Label>
                  <Input
                    id="logline"
                    className="h-12 bg-[#0d0b08] border-[#e8a020]/35 text-[#faf6f0] transition-all focus:border-[#e8a020] focus:ring-2 focus:ring-[#e8a020]/20"
                    placeholder="영화를 한 줄로 설명해주세요"
                    {...register("logline")}
                  />
                  {errors.logline && (
                    <p className="text-sm text-[#e8a020] font-medium animate-in slide-in-from-top-1">
                      {errors.logline.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-medium text-[#f0e8d8]">
                    상세 설명 <span className="text-[#e8a020]">*</span>
                  </Label>
                  <textarea
                    id="description"
                    rows={6}
                    className="w-full rounded-md border border-[#e8a020]/35 bg-[#0d0b08]/80 px-4 py-3 text-sm text-[#faf6f0] placeholder:text-[#b8a898] transition-all focus:border-[#e8a020] focus:ring-2 focus:ring-[#e8a020]/20 focus:outline-none"
                    placeholder="영화의 상세한 내용을 입력해주세요"
                    {...register("description")}
                  />
                  {errors.description && (
                    <p className="text-sm text-[#e8a020] font-medium animate-in slide-in-from-top-1">
                      {errors.description.message}
                    </p>
                  )}
                </div>
              </div>

              {/* 영상 정보 섹션 */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-[#e8a020]/20 pb-2">
                  <span className="text-2xl">🎥</span>
                  <h2 className="text-xl font-semibold text-[#e8a020]">영상 정보</h2>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="videoPlatform" className="text-base font-medium text-[#f0e8d8]">
                      영상 플랫폼 <span className="text-[#e8a020]">*</span>
                    </Label>
                    <Select
                      value={watch("videoPlatform") || ""}
                      onValueChange={(value) => setValue("videoPlatform", value as "youtube" | "vimeo")}
                    >
                      <SelectTrigger className="h-12 bg-[#0d0b08] border-[#e8a020]/35 text-[#faf6f0] transition-all focus:border-[#e8a020] focus:ring-2 focus:ring-[#e8a020]/20">
                        <SelectValue placeholder="플랫폼 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#100e0a] border-[#e8a020]/30">
                        <SelectItem value="youtube" className="text-[#e8a020] hover:bg-[#e8a020]/10 focus:bg-[#e8a020]/10 cursor-pointer">▶️ YouTube</SelectItem>
                        <SelectItem value="vimeo" className="text-[#e8a020] hover:bg-[#e8a020]/10 focus:bg-[#e8a020]/10 cursor-pointer">🎬 Vimeo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="year" className="text-base font-medium text-[#f0e8d8]">
                      제작 연도
                    </Label>
                    <Input
                      id="year"
                      type="number"
                      className="h-12 bg-[#0d0b08] border-[#e8a020]/35 text-[#faf6f0] transition-all focus:border-[#e8a020] focus:ring-2 focus:ring-[#e8a020]/20"
                      placeholder="예: 2024"
                      {...register("year", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="videoUrl" className="text-base font-medium text-[#f0e8d8]">
                    영상 URL <span className="text-[#e8a020]">*</span>
                  </Label>
                  <Input
                    id="videoUrl"
                    className="h-12 bg-[#0d0b08] border-[#e8a020]/35 text-[#faf6f0] transition-all focus:border-[#e8a020] focus:ring-2 focus:ring-[#e8a020]/20"
                    placeholder={
                      videoPlatform === "youtube"
                        ? "https://www.youtube.com/watch?v=..."
                        : "https://vimeo.com/..."
                    }
                    {...register("videoUrl")}
                  />
                  {errors.videoUrl && (
                    <p className="text-sm text-[#e8a020] font-medium animate-in slide-in-from-top-1">
                      {errors.videoUrl.message}
                    </p>
                  )}
                </div>
              </div>

              {/* 썸네일 업로드 섹션 */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-[#e8a020]/20 pb-2">
                  <span className="text-2xl">🖼️</span>
                  <h2 className="text-xl font-semibold text-[#e8a020]">썸네일 이미지</h2>
                </div>

                {/* 드래그 앤 드롭 영역 */}
                <div
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all ${
                    isDragging
                      ? "border-[#e8a020]/100 bg-[#100e0a]/20"
                      : "border-[#e8a020]/35 bg-[#0d0b08]/50 hover:border-[#e8a020]/50 hover:bg-[#e8a020]/10"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  {thumbnailPreview || thumbnailUrl ? (
                    <div className="relative p-6">
                      <img
                        src={thumbnailPreview || thumbnailUrl || ""}
                        alt="썸네일 미리보기"
                        className="mx-auto h-48 w-full rounded-lg object-cover shadow-lg"
                      />
                      {uploadingThumbnail && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 backdrop-blur-sm">
                          <div className="flex flex-col items-center gap-2">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#e8a020] border-t-transparent" />
                            <span className="text-sm text-[#e8a020]">업로드 중...</span>
                          </div>
                        </div>
                      )}
                      <div className="mt-4 text-center">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="border-[#e8a020]/50 text-[#e8a020] hover:bg-[#e8a020]/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setThumbnailPreview(null);
                            setValue("thumbnailUrl", "");
                            setValue("thumbnailPath", "");
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                        >
                          이미지 변경
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8a020]/10">
                        <span className="text-3xl">📸</span>
                      </div>
                      <p className="mb-2 text-lg font-medium text-[#f0e8d8]">
                        {uploadingThumbnail ? "업로드 중..." : "이미지를 드래그하거나 클릭하여 업로드"}
                      </p>
                      <p className="text-sm text-[#b8a898]">
                        PNG, JPG, GIF 최대 5MB
                      </p>
                      {uploadingThumbnail && (
                        <div className="mt-4">
                          <div className="mx-auto h-2 w-48 overflow-hidden rounded-full bg-[#e8a020]/25">
                            <div className="h-full w-full animate-pulse bg-[#e8a020]" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* URL 입력 (대안) */}
                <div className="space-y-2">
                  <Label htmlFor="thumbnailUrl" className="text-sm font-medium text-[#b8a898]">
                    또는 이미지 URL 직접 입력
                  </Label>
                  <Input
                    id="thumbnailUrl"
                    className="bg-[#0d0b08] border-[#e8a020]/35 text-[#faf6f0] transition-all focus:border-[#e8a020] focus:ring-2 focus:ring-[#e8a020]/20"
                    placeholder="https://example.com/image.jpg"
                    {...register("thumbnailUrl")}
                  />
                </div>
              </div>

              {/* 제작진 크레딧 섹션 */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-[#e8a020]/20 pb-2">
                  <span className="text-2xl">👥</span>
                  <h2 className="text-xl font-semibold text-[#e8a020]">제작진 크레딧</h2>
                </div>

                <div className="space-y-4">
                  {fields.map((field, index) => {
                    const selectedActorId = watch(`credits.${index}.actorId`);
                    const selectedActor = actors.find((a) => a.id === selectedActorId);
                    
                    return (
                      <div
                        key={field.id}
                        className="group rounded-xl border border-[#e8a020]/35 bg-gradient-to-br from-[#0d0b08]/50 to-[#100e0a]/50 p-6 backdrop-blur-sm transition-all hover:border-[#e8a020]/30 hover:shadow-lg"
                      >
                        <div className="mb-4 flex items-center justify-between">
                          <span className="text-sm font-medium text-[#e8a020]">
                            크레딧 #{index + 1}
                          </span>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 text-[#e8a020] hover:bg-[#100e0a]/20 hover:text-[#e8a020]/80"
                              onClick={() => remove(index)}
                            >
                              삭제
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label className="text-sm text-[#b8a898]">역할</Label>
                            <Input
                              className="bg-[#0d0b08] border-[#e8a020]/35 text-[#faf6f0]"
                              placeholder="예: 감독, 주연"
                              {...register(`credits.${index}.role`)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm text-[#b8a898]">이름</Label>
                            <Input
                              className="bg-[#0d0b08] border-[#e8a020]/35 text-[#faf6f0]"
                              placeholder="이름"
                              value={selectedActor ? selectedActor.stageName : watch(`credits.${index}.name`) || ""}
                              onChange={(e) => {
                                setValue(`credits.${index}.name`, e.target.value);
                                if (selectedActorId) {
                                  setValue(`credits.${index}.actorId`, undefined);
                                }
                              }}
                            />
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <Label className="text-sm text-[#b8a898]">사이트 내 배우 선택 (선택)</Label>
                          <Select
                            value={selectedActorId || "none"}
                            onValueChange={(value) => {
                              if (value === "none") {
                                setValue(`credits.${index}.actorId`, undefined);
                              } else {
                                const actor = actors.find((a) => a.id === value);
                                if (actor) {
                                  setValue(`credits.${index}.actorId`, actor.id);
                                  setValue(`credits.${index}.name`, actor.stageName);
                                  setValue(`credits.${index}.profileLink`, `/actors/${actor.id}`);
                                }
                              }
                            }}
                          >
                            <SelectTrigger className="bg-[#0d0b08] border-[#e8a020]/35 text-[#faf6f0]">
                              <SelectValue placeholder="배우 선택 (선택)" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#100e0a] border-[#e8a020]/30 max-h-[200px]">
                              <SelectItem value="none" className="text-[#e8a020] hover:bg-[#e8a020]/10 focus:bg-[#e8a020]/10 cursor-pointer">
                                선택 안 함
                              </SelectItem>
                              {actors.map((actor) => (
                                <SelectItem
                                  key={actor.id}
                                  value={actor.id}
                                  className="text-[#e8a020] hover:bg-[#e8a020]/10 focus:bg-[#e8a020]/10 cursor-pointer"
                                >
                                  {actor.stageName} ({actor.location})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="mt-4 space-y-2">
                          <Label className="text-sm text-[#b8a898]">외부 프로필 링크 (선택)</Label>
                          <Input
                            className="bg-[#0d0b08] border-[#e8a020]/35 text-[#faf6f0]"
                            placeholder="https://..."
                            {...register(`credits.${index}.profileLink`)}
                            disabled={!!selectedActorId}
                          />
                          {selectedActorId && (
                            <p className="text-xs text-[#e8a020]">
                              ✨ 배우 프로필이 자동으로 연결됩니다
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-[#e8a020]/50 text-[#e8a020] hover:bg-[#e8a020]/10"
                    onClick={() => append({ role: "", name: "", profileLink: "", actorId: undefined })}
                  >
                    + 크레딧 추가
                  </Button>
                </div>
              </div>

              {/* 태그 섹션 */}
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-base font-medium text-[#f0e8d8]">
                  태그
                </Label>
                <Input
                  id="tags"
                  className="h-12 bg-[#0d0b08] border-[#e8a020]/35 text-[#faf6f0] transition-all focus:border-[#e8a020] focus:ring-2 focus:ring-[#e8a020]/20"
                  placeholder="예: 독립영화, 단편영화, 대학생작품 (쉼표로 구분)"
                  {...register("tags")}
                />
                <p className="text-xs text-[#b8a898]">
                  태그는 쉼표로 구분하여 입력하세요
                </p>
              </div>

              {/* 제출 버튼 */}
              <div className="flex gap-4 border-t border-[#e8a020]/20 pt-8">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-12 bg-gradient-to-r from-[#e8a020]/100 via-[#e8a020]/100 to-[#e8a020]/100 text-base font-semibold text-black shadow-lg transition-all hover:from-[#e8a020] hover:via-[#e8a020] hover:to-[#e8a020] hover:shadow-[#e8a020]/50 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                      업로드 중...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>🚀</span>
                      영화 업로드
                    </span>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 border-[#e8a020]/35 text-[#f0e8d8] transition-all hover:bg-[#e8a020]/10 hover:text-[#faf6f0]"
                  onClick={() => router.back()}
                >
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
