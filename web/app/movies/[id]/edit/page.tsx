"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { getMovieById, Movie, updateMovie, MovieGenre, MovieStatus } from "@/lib/movies";
import { uploadMovieThumbnail } from "@/lib/storage";
import { getFilmmakerByUserId } from "@/lib/filmmakers";
import { getActors } from "@/lib/actors";
import { Actor } from "@/lib/actors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
      ),
      actorId: z.string().optional(),
    })
  ).optional(),
  year: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return isNaN(num) ? undefined : num;
    },
    z.number().optional()
  ).refine((val) => val === undefined || !isNaN(val), {
    message: "제작 연도는 숫자로 입력해주세요",
  }) as unknown as z.ZodOptional<z.ZodNumber>,
  tags: z.string().optional(),
});

type MovieForm = z.infer<typeof movieSchema>;

export default function EditMoviePage() {
  const params = useParams();
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
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
      status: "production",
    },
  });

  const {
    fields: creditFields,
    append: appendCredit,
    remove: removeCredit,
  } = useFieldArray({
    control,
    name: "credits",
  });

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      router.push("/login");
      return;
    }
    if (userProfile) {
      if (!userProfile.role || userProfile.role !== "filmmaker") {
        router.push("/");
        return;
      }
    }
    if (params.id) {
      loadMovie(params.id as string);
      loadActors();
    }
  }, [params.id, user, userProfile, authLoading]);

  const loadMovie = async (movieId: string) => {
    try {
      setLoading(true);
      const movieData = await getMovieById(movieId);
      
      if (!movieData) {
        alert("영화를 찾을 수 없습니다.");
        router.push("/movies");
        return;
      }

      // 권한 확인: 제작자만 수정 가능 (팀 제작자의 경우 filmmakerId가 일치하면 수정 가능)
      const filmmaker = await getFilmmakerByUserId(user?.uid || "");
      if (!filmmaker) {
        alert("제작자 프로필을 찾을 수 없습니다.");
        router.push(`/movies/${movieId}`);
        return;
      }
      
      // filmmakerId가 현재 사용자의 filmmaker ID와 일치하는지 확인
      if (movieData.filmmakerId !== filmmaker.id) {
        alert("이 영화를 수정할 권한이 없습니다.");
        router.push(`/movies/${movieId}`);
        return;
      }

      setMovie(movieData);
      setThumbnailPreview(movieData.thumbnailUrl || null);

      // 폼 데이터 설정
      setValue("title", movieData.title);
      setValue("genre", movieData.genre);
      setValue("status", movieData.status || "production");
      setValue("runtimeMinutes", movieData.runtimeMinutes);
      setValue("logline", movieData.logline);
      setValue("description", movieData.description);
      setValue("videoPlatform", movieData.videoPlatform);
      setValue("videoUrl", movieData.videoUrl);
      setValue("thumbnailUrl", movieData.thumbnailUrl || "");
      setValue("thumbnailPath", movieData.thumbnailPath || "");
      setValue("year", movieData.year || undefined);
      setValue("tags", movieData.tags?.join(", ") || "");
      
      if (movieData.credits && movieData.credits.length > 0) {
        setValue("credits", movieData.credits.map(c => ({
          role: c.role || "",
          name: c.name || "",
          profileLink: c.profileLink || "",
          actorId: c.actorId || undefined,
        })));
      }
    } catch (error) {
      console.error("Error loading movie:", error);
      alert("영화를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const loadActors = async () => {
    try {
      setLoadingActors(true);
      const { actors: allActors } = await getActors({ limitCount: 100 });
      setActors(allActors);
    } catch (error) {
      console.error("Error loading actors:", error);
    } finally {
      setLoadingActors(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
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

      const previewUrl = URL.createObjectURL(file);
      setThumbnailPreview(previewUrl);

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

  const onSubmit = async (data: MovieForm) => {
    if (!user || !movie) {
      router.push("/login");
      return;
    }

    try {
      setSaving(true);
      setError(null);

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
          ?.filter((c) => c.role && c.name)
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
          }) || [],
        taggedActorIds: data.credits
          ?.filter((c) => c.actorId)
          .map((c) => c.actorId!)
          .filter((id, index, self) => self.indexOf(id) === index) || [],
        year: data.year || null,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter((t) => t) : [],
        updatedAt: new Date(),
      });

      await updateMovie(movie.id, movieData);
      router.push(`/movies/${movie.id}`);
    } catch (err: any) {
      console.error("영화 수정 에러:", err);
      setError(err.message || "영화 수정에 실패했습니다");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0805] text-[#f0e8d8]">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-[#e8a020] border-t-transparent" />
            <p className="mt-4 text-[#8a807a]">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0805] text-[#f0e8d8]">
      {/* 히어로 섹션 */}
      <div className="relative overflow-hidden border-b border-[#5a5248]/30 bg-[#100e0a]">
        <div className="film-strip absolute inset-0 opacity-10" />
        <div className="container relative mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl">
            <Link href={`/movies/${movie.id}`} className="mb-4 inline-block text-[#e8a020] hover:text-[#e8a020]300">
              ← 영화로 돌아가기
            </Link>
            <h1 className="mb-4 text-4xl font-bold tracking-tight film-gold">
              영화 수정
            </h1>
            <p className="text-[#8a807a]">{movie.title}</p>
          </div>
        </div>
      </div>

      {/* 폼 */}
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <Card className="border-[#5a5248]/30 bg-[#100e0a]">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <div className="rounded-lg bg-[#e8a020]/20 border border-[#e8a020]/50 p-4 text-[#e8a020]">
                    {error}
                  </div>
                )}

                {/* 제목 */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-[#8a807a]">
                    제목 *
                  </Label>
                  <Input
                    id="title"
                    {...register("title")}
                    className="bg-[#181410] border-[#5a5248]/40 text-white"
                  />
                  {errors.title && (
                    <p className="text-sm text-[#e8a020]">{errors.title.message}</p>
                  )}
                </div>

                {/* 장르, 러닝타임, 상태 */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="genre" className="text-[#8a807a]">
                      장르 *
                    </Label>
                    <Select
                      value={watch("genre") || ""}
                      onValueChange={(value) => setValue("genre", value as MovieGenre)}
                    >
                      <SelectTrigger className="bg-[#181410] border-[#5a5248]/40 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#181410]900 border-[#e8a020]/30">
                        <SelectItem value="drama" className="text-[#e8a020] hover:bg-[#e8a020]/10">드라마</SelectItem>
                        <SelectItem value="comedy" className="text-[#e8a020] hover:bg-[#e8a020]/10">코미디</SelectItem>
                        <SelectItem value="horror" className="text-[#e8a020] hover:bg-[#e8a020]/10">공포</SelectItem>
                        <SelectItem value="romance" className="text-[#e8a020] hover:bg-[#e8a020]/10">로맨스</SelectItem>
                        <SelectItem value="etc" className="text-[#e8a020] hover:bg-[#e8a020]/10">기타</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.genre && (
                      <p className="text-sm text-[#e8a020]">{errors.genre.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="runtimeMinutes" className="text-[#8a807a]">
                      러닝타임 (분) *
                    </Label>
                    <Input
                      id="runtimeMinutes"
                      type="number"
                      {...register("runtimeMinutes", { valueAsNumber: true })}
                      className="bg-[#181410] border-[#5a5248]/40 text-white"
                    />
                    {errors.runtimeMinutes && (
                      <p className="text-sm text-[#e8a020]">{errors.runtimeMinutes.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-[#8a807a]">
                      제작 상태 *
                    </Label>
                    <Select
                      value={watch("status") || ""}
                      onValueChange={(value) => setValue("status", value as MovieStatus)}
                    >
                      <SelectTrigger className="bg-[#181410] border-[#5a5248]/40 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#181410]900 border-[#e8a020]/30">
                        <SelectItem value="production" className="text-[#e8a020] hover:bg-[#e8a020]/10">제작중</SelectItem>
                        <SelectItem value="planned" className="text-[#e8a020] hover:bg-[#e8a020]/10">제작예정</SelectItem>
                        <SelectItem value="completed" className="text-[#e8a020] hover:bg-[#e8a020]/10">제작완료</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.status && (
                      <p className="text-sm text-[#e8a020]">{errors.status.message}</p>
                    )}
                  </div>
                </div>

                {/* 한 줄 요약 */}
                <div className="space-y-2">
                  <Label htmlFor="logline" className="text-[#8a807a]">
                    한 줄 요약 *
                  </Label>
                  <Input
                    id="logline"
                    {...register("logline")}
                    className="bg-[#181410] border-[#5a5248]/40 text-white"
                  />
                  {errors.logline && (
                    <p className="text-sm text-[#e8a020]">{errors.logline.message}</p>
                  )}
                </div>

                {/* 상세 설명 */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-[#8a807a]">
                    상세 설명 *
                  </Label>
                  <textarea
                    id="description"
                    rows={6}
                    {...register("description")}
                    className="w-full rounded-md border border-[#5a5248]/40 bg-[#181410] px-3 py-2 text-white placeholder:text-[#5a5248] focus:border-[#e8a020] focus:outline-none focus:ring-1 focus:ring-[#e8a020]/20"
                  />
                  {errors.description && (
                    <p className="text-sm text-[#e8a020]">{errors.description.message}</p>
                  )}
                </div>

                {/* 영상 플랫폼 및 URL */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="videoPlatform" className="text-[#8a807a]">
                      영상 플랫폼 *
                    </Label>
                    <Select
                      value={watch("videoPlatform") || ""}
                      onValueChange={(value) => setValue("videoPlatform", value as "youtube" | "vimeo")}
                    >
                      <SelectTrigger className="bg-[#181410] border-[#5a5248]/40 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#181410]900 border-[#e8a020]/30">
                        <SelectItem value="youtube" className="text-[#e8a020] hover:bg-[#e8a020]/10">YouTube</SelectItem>
                        <SelectItem value="vimeo" className="text-[#e8a020] hover:bg-[#e8a020]/10">Vimeo</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.videoPlatform && (
                      <p className="text-sm text-[#e8a020]">{errors.videoPlatform.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="videoUrl" className="text-[#8a807a]">
                      영상 URL *
                    </Label>
                    <Input
                      id="videoUrl"
                      {...register("videoUrl")}
                      className="bg-[#181410] border-[#5a5248]/40 text-white"
                    />
                    {errors.videoUrl && (
                      <p className="text-sm text-[#e8a020]">{errors.videoUrl.message}</p>
                    )}
                  </div>
                </div>

                {/* 썸네일 업로드 */}
                <div className="space-y-2">
                  <Label className="text-[#8a807a]">썸네일</Label>
                  <div
                    ref={dropZoneRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                      isDragging
                        ? "border-[#e8a020] bg-[#e8a020]/10"
                        : "border-[#5a5248]/40 bg-[#181410]800/30"
                    }`}
                  >
                    {thumbnailPreview ? (
                      <div className="relative">
                        <img
                          src={thumbnailPreview}
                          alt="썸네일 미리보기"
                          className="mx-auto max-h-48 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setThumbnailPreview(null);
                            setValue("thumbnailUrl", "");
                            setValue("thumbnailPath", "");
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          }}
                          className="mt-2 text-sm text-[#e8a020] hover:text-[#e8a020]300"
                        >
                          제거
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="mb-2 text-sm text-[#8a807a]">
                          이미지를 드래그하거나 클릭하여 업로드
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingThumbnail}
                          variant="outline"
                          className="border-[#e8a020]/50 text-[#e8a020] hover:bg-[#e8a020]/10"
                        >
                          {uploadingThumbnail ? "업로드 중..." : "파일 선택"}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 제작진 */}
                <div className="space-y-2">
                  <Label className="text-[#8a807a]">제작진</Label>
                  {creditFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 gap-4 md:grid-cols-4 mb-4">
                      <Input
                        {...register(`credits.${index}.role`)}
                        placeholder="역할"
                        className="bg-[#181410] border-[#5a5248]/40 text-white"
                      />
                      <Input
                        {...register(`credits.${index}.name`)}
                        placeholder="이름"
                        className="bg-[#181410] border-[#5a5248]/40 text-white"
                      />
                      <Select
                        value={watch(`credits.${index}.actorId`) || "none"}
                        onValueChange={(value) => setValue(`credits.${index}.actorId`, value === "none" ? undefined : value)}
                      >
                        <SelectTrigger className="bg-[#181410] border-[#5a5248]/40 text-white">
                          <SelectValue placeholder="배우 선택" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#181410]900 border-[#e8a020]/30">
                          <SelectItem value="none" className="text-[#e8a020] hover:bg-[#e8a020]/10">선택 안 함</SelectItem>
                          {actors.map((actor) => (
                            <SelectItem
                              key={actor.id}
                              value={actor.id}
                              className="text-[#e8a020] hover:bg-[#e8a020]/10"
                            >
                              {actor.stageName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Input
                          {...register(`credits.${index}.profileLink`)}
                          placeholder="프로필 링크"
                          className="bg-[#181410] border-[#5a5248]/40 text-white"
                        />
                        {creditFields.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeCredit(index)}
                            variant="outline"
                            className="border-[#e8a020]/50 text-[#e8a020] hover:bg-[#e8a020]/10"
                          >
                            삭제
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={() => appendCredit({ role: "", name: "", profileLink: "", actorId: undefined })}
                    variant="outline"
                    className="border-[#e8a020]/50 text-[#e8a020] hover:bg-[#e8a020]/10"
                  >
                    + 제작진 추가
                  </Button>
                </div>

                {/* 제작 연도, 태그 */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="year" className="text-[#8a807a]">
                      제작 연도
                    </Label>
                    <Input
                      id="year"
                      type="number"
                      {...register("year", { valueAsNumber: true })}
                      className="bg-[#181410] border-[#5a5248]/40 text-white"
                    />
                    {errors.year && (
                      <p className="text-sm text-[#e8a020]">{errors.year.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags" className="text-[#8a807a]">
                      태그 (쉼표로 구분)
                    </Label>
                    <Input
                      id="tags"
                      {...register("tags")}
                      placeholder="예: 독립영화, 단편영화"
                      className="bg-[#181410] border-[#5a5248]/40 text-white"
                    />
                  </div>
                </div>

                {/* 제출 버튼 */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/movies/${movie.id}`)}
                    className="flex-1 border-[#5a5248]/40 text-[#8a807a] hover:bg-[#e8a020]/10"
                  >
                    취소
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r btn-primary-gradient text-black "
                  >
                    {saving ? "저장 중..." : "저장하기"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
