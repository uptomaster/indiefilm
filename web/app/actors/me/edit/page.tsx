"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import {
  getActorByUserId,
  createOrUpdateActorProfile,
  AgeRange,
  getAgeRangeLabel,
} from "@/lib/actors";
import { uploadActorPhoto } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const actorSchema = z.object({
  stageName: z.string().min(1, "예명을 입력해주세요"),
  ageRange: z.enum(["10s", "20s", "30s", "40s", "50plus"], {
    message: "나이대를 선택해주세요",
  }),
  heightCm: z.preprocess(
    (val) => {
      if (val === "" || val == null || val === undefined) return undefined;
      const str = String(val).trim();
      if (str === "") return undefined;
      const num = Number(str);
      return isNaN(num) ? undefined : num;
    },
    z.number({ message: "키는 숫자로 입력해주세요" })
      .min(100, "키는 100cm 이상 입력해주세요")
      .max(250, "키는 250cm 이하로 입력해주세요")
      .optional()
  ) as unknown as z.ZodOptional<z.ZodNumber>,
  bodyType: z.string().min(1, "체형을 입력해주세요"),
  location: z.string().min(1, "지역을 선택해주세요"),
  bio: z.string().min(10, "자기소개를 최소 10자 이상 입력해주세요"),
  email: z.string().email("올바른 이메일 형식을 입력해주세요").optional().or(z.literal("")),
  phone: z.string().optional(),
  mainPhotoUrl: z.string().url("올바른 URL 형식을 입력해주세요").optional().or(z.literal("")),
  mainPhotoPath: z.string().optional(),
  demoPlatform: z.enum(["youtube", "vimeo"], {
    message: "플랫폼을 선택해주세요",
  }).optional(),
  demoUrl: z.string().url("올바른 URL 형식을 입력해주세요").optional().or(z.literal("")),
  experience: z.array(z.string().min(1, "경력을 입력해주세요")),
  skills: z.array(z.string().min(1, "스킬을 입력해주세요")),
  gallery: z.array(
    z.object({
      url: z.string().url("올바른 URL 형식을 입력해주세요"),
      path: z.string(),
    })
  ).optional(),
  isPublic: z.boolean({
    message: "공개 설정을 선택해주세요",
  }),
  mbti: z.string().optional().or(z.literal("")),
  traits: z.object({
    acting: z.number().min(0).max(100).optional(),
    appearance: z.number().min(0).max(100).optional(),
    charisma: z.number().min(0).max(100).optional(),
    emotion: z.number().min(0).max(100).optional(),
    humor: z.number().min(0).max(100).optional(),
    action: z.number().min(0).max(100).optional(),
  }).optional(),
});

type ActorForm = z.infer<typeof actorSchema>;

const ageRanges: AgeRange[] = ["10s", "20s", "30s", "40s", "50plus"];
const locations = ["서울", "부산", "인천", "대구", "광주", "대전", "울산", "기타"];

export default function ActorProfileEditPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
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
  } = useForm<ActorForm>({
    resolver: zodResolver(actorSchema),
    defaultValues: {
      experience: [""],
      skills: [""],
      isPublic: true,
      gallery: [],
      demoPlatform: undefined,
      mbti: "",
      heightCm: undefined,
      traits: {
        acting: 50,
        appearance: 50,
        charisma: 50,
        emotion: 50,
        humor: 50,
        action: 50,
      },
    },
  });

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
  } = useFieldArray({
    control,
    name: "experience" as any,
  });

  const {
    fields: skillFields,
    append: appendSkill,
    remove: removeSkill,
  } = useFieldArray({
    control,
    name: "skills" as any,
  });

  const isPublic = watch("isPublic");
  const mainPhotoUrl = watch("mainPhotoUrl");

  // 파일 업로드 핸들러
  const handleFileUpload = async (file: File) => {
    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }

    try {
      setUploadingPhoto(true);
      setError(null);

      // 미리보기 생성
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);

      // 업로드
      const { url, path } = await uploadActorPhoto(file, user.uid);
      setValue("mainPhotoUrl", url);
      setValue("mainPhotoPath", path);
      setPhotoPreview(null); // 업로드 완료 후 미리보기 제거
    } catch (error: any) {
      console.error("업로드 에러:", error);
      const errorMessage = error.message || "이미지 업로드에 실패했습니다.";
      setError(errorMessage);
      setPhotoPreview(null);
      
      if (errorMessage.includes("Storage") || errorMessage.includes("CORS")) {
        alert(
          "Storage가 활성화되지 않았습니다.\n\n" +
          "해결 방법:\n" +
          "1. Firebase 콘솔에서 Storage 활성화\n" +
          "2. 또는 아래 URL 입력 필드를 사용하세요"
        );
      }
    } finally {
      setUploadingPhoto(false);
    }
  };

  // 프로필 로드 시 미리보기 설정
  useEffect(() => {
    if (mainPhotoUrl && !photoPreview) {
      // URL이 변경되면 미리보기 업데이트
    }
  }, [mainPhotoUrl]);

  useEffect(() => {
    // 인증 상태가 로딩 중이면 대기
    if (authLoading) {
      return;
    }

    // 사용자가 없으면 로그인 페이지로
    if (!user) {
      router.push("/login");
      return;
    }

    // 사용자 프로필이 로딩되었을 때
    if (userProfile) {
      // 역할이 없으면 역할 선택 페이지로
      if (!userProfile.role) {
        router.push("/role-select");
        return;
      }
      // 역할이 actor가 아니면 역할 선택 페이지로
      if (userProfile.role !== "actor") {
        router.push("/role-select");
        return;
      }
      // 역할이 actor면 프로필 로드
      loadProfile();
    }
  }, [user, userProfile, authLoading]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const actorData = await getActorByUserId(user.uid);
      if (actorData) {
        setValue("stageName", actorData.stageName);
        setValue("ageRange", actorData.ageRange);
        setValue("heightCm", actorData.heightCm);
        setValue("bodyType", actorData.bodyType);
        setValue("location", actorData.location);
        setValue("bio", actorData.bio);
        setValue("email", actorData.email || "");
        setValue("phone", actorData.phone || "");
        setValue("mainPhotoUrl", actorData.mainPhotoUrl || "");
        setValue("mainPhotoPath", actorData.mainPhotoPath || "");
        setValue("demoPlatform", actorData.demoPlatform || undefined);
        setValue("demoUrl", actorData.demoUrl || "");
        setValue("experience", actorData.experience.length > 0 ? actorData.experience : [""]);
        setValue("skills", actorData.skills.length > 0 ? actorData.skills : [""]);
        setValue("isPublic", actorData.isPublic);
        setValue("gallery", actorData.gallery || []);
        setValue("mbti", actorData.mbti || "");
        setValue("traits", actorData.traits || {
          acting: 50,
          appearance: 50,
          charisma: 50,
          emotion: 50,
          humor: 50,
          action: 50,
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ActorForm) => {
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (!data.heightCm) {
        setError("키를 입력해주세요.");
        return;
      }

      await createOrUpdateActorProfile(user.uid, {
        stageName: data.stageName,
        ageRange: data.ageRange,
        heightCm: data.heightCm,
        bodyType: data.bodyType,
        location: data.location,
        bio: data.bio,
        email: data.email && data.email.trim() !== "" ? data.email.trim() : undefined,
        phone: data.phone && data.phone.trim() !== "" ? data.phone.trim() : undefined,
        mainPhotoUrl: data.mainPhotoUrl && data.mainPhotoUrl.trim() !== "" ? data.mainPhotoUrl : undefined,
        mainPhotoPath: data.mainPhotoPath && data.mainPhotoPath.trim() !== "" ? data.mainPhotoPath : undefined,
        demoPlatform: data.demoPlatform || null,
        demoUrl: (data.demoUrl && data.demoUrl.trim() !== "") ? data.demoUrl : null,
        experience: data.experience.filter((exp) => exp.trim() !== ""),
        skills: data.skills.filter((skill) => skill.trim() !== ""),
        gallery: data.gallery || [],
        isPublic: data.isPublic,
        mbti: data.mbti && data.mbti.trim() !== "" ? data.mbti : undefined,
        traits: data.traits && 
                typeof data.traits.acting === 'number' && 
                typeof data.traits.appearance === 'number' && 
                typeof data.traits.charisma === 'number' && 
                typeof data.traits.emotion === 'number' && 
                typeof data.traits.humor === 'number' && 
                typeof data.traits.action === 'number'
          ? {
              acting: data.traits.acting,
              appearance: data.traits.appearance,
              charisma: data.traits.charisma,
              emotion: data.traits.emotion,
              humor: data.traits.humor,
              action: data.traits.action,
            } as { acting: number; appearance: number; charisma: number; emotion: number; humor: number; action: number }
          : undefined,
      });

      alert("프로필이 저장되었습니다!");
      router.push("/actors/me/view");
    } catch (err: any) {
      setError(err.message || "프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
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

  return (
    <div className="min-h-screen bg-[#0a0805] text-[#f0e8d8]">
      {/* 히어로 섹션 */}
      <div className="relative overflow-hidden border-b border-[#100e0a]/30 bg-gradient-to-b from-[#100e0a] to-[#0a0805]">
        <div className="film-strip absolute inset-0 opacity-10" />
        <div className="container relative mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-5xl font-bold tracking-tight film-gold">
              ACTOR PROFILE EDIT
            </h1>
            <p className="text-xl text-[#8a807a]">
              당신의 프로필을 완성하고 제작자들에게 어필하세요
            </p>
          </div>
        </div>
      </div>

      {/* 폼 섹션 */}
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Card className="border-[#e8a020]/20 bg-[#100e0a] backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-3xl film-gold">프로필 정보</CardTitle>
            <CardDescription className="text-[#8a807a]">
              모든 정보는 제작자들이 검색할 수 있도록 공개됩니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 rounded-md bg-[#100e0a]/20 border border-[#e8a020]/30 p-4 text-[#e8a020]/80">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* 기본 정보 */}
              <section className="space-y-4">
                <h2 className="border-b border-[#e8a020]/30 pb-2 text-xl font-bold film-gold">
                  기본 정보
                </h2>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="stageName" className="text-[#8a807a]">
                      예명 *
                    </Label>
                    <Input
                      id="stageName"
                      className="bg-[#181410] border-[#5a5248]/40 text-[#faf6f0]"
                      {...register("stageName")}
                    />
                    {errors.stageName && (
                      <p className="text-sm text-[#e8a020] font-medium">
                        {errors.stageName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ageRange" className="text-[#8a807a]">
                      나이대 *
                    </Label>
                    <Select
                      value={watch("ageRange")}
                      onValueChange={(value) =>
                        setValue("ageRange", value as AgeRange)
                      }
                    >
                      <SelectTrigger className="bg-[#181410] border-[#5a5248]/40 text-[#faf6f0]">
                        <SelectValue placeholder="나이대 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#181410]900 border-[#e8a020]/30">
                        {ageRanges.map((age) => (
                          <SelectItem key={age} value={age} className="text-[#e8a020] hover:bg-[#e8a020]/10 focus:bg-[#e8a020]/10 cursor-pointer">
                            {getAgeRangeLabel(age)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.ageRange && (
                      <p className="text-sm text-[#e8a020] font-medium">
                        {errors.ageRange.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="heightCm" className="text-[#8a807a]">
                      키 (cm) *
                    </Label>
                    <Input
                      id="heightCm"
                      type="number"
                      className="bg-[#181410] border-[#5a5248]/40 text-[#faf6f0]"
                      {...register("heightCm", { valueAsNumber: true })}
                    />
                    {errors.heightCm && (
                      <p className="text-sm text-[#e8a020] font-medium">
                        {String(errors.heightCm.message || '키를 올바르게 입력해주세요')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bodyType" className="text-[#8a807a]">
                      체형 *
                    </Label>
                    <Input
                      id="bodyType"
                      placeholder="예: 마른 체형, 보통 체형, 근육질"
                      className="bg-[#181410] border-[#5a5248]/40 text-[#faf6f0]"
                      {...register("bodyType")}
                    />
                    {errors.bodyType && (
                      <p className="text-sm text-[#e8a020] font-medium">
                        {errors.bodyType.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="location" className="text-[#8a807a]">
                      지역 *
                    </Label>
                    <Select
                      value={watch("location")}
                      onValueChange={(value) => setValue("location", value)}
                    >
                      <SelectTrigger className="bg-[#181410] border-[#5a5248]/40 text-[#faf6f0]">
                        <SelectValue placeholder="지역 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#181410]900 border-[#e8a020]/30">
                        {locations.map((loc) => (
                          <SelectItem key={loc} value={loc} className="text-[#e8a020] hover:bg-[#e8a020]/10 focus:bg-[#e8a020]/10 cursor-pointer">
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.location && (
                      <p className="text-sm text-[#e8a020] font-medium">
                        {errors.location.message}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* 자기소개 */}
              <section className="space-y-4">
                <h2 className="border-b border-[#e8a020]/30 pb-2 text-xl font-bold film-gold">
                  자기소개
                </h2>
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-[#8a807a]">
                    자기소개 *
                  </Label>
                  <textarea
                    id="bio"
                    rows={6}
                    className="w-full rounded-md border border-[#5a5248]/40 bg-[#181410] px-3 py-2 text-[#faf6f0] placeholder:text-gray-500"
                    placeholder="당신의 연기 스타일, 경력, 특기 등을 자유롭게 작성해주세요..."
                    {...register("bio")}
                  />
                  {errors.bio && (
                    <p className="text-sm text-[#e8a020] font-medium">{errors.bio.message}</p>
                  )}
                </div>
              </section>

              {/* 연락처 */}
              <section className="space-y-4">
                <h2 className="border-b border-[#e8a020]/30 pb-2 text-xl font-bold film-gold">
                  연락처
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[#8a807a]">
                      이메일
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      className="bg-[#181410] border-[#5a5248]/40 text-[#faf6f0]"
                      {...register("email")}
                    />
                    {errors.email && (
                      <p className="text-sm text-[#e8a020] font-medium">{errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[#8a807a]">
                      전화번호
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="010-1234-5678"
                      className="bg-[#181410] border-[#5a5248]/40 text-[#faf6f0]"
                      {...register("phone")}
                    />
                    {errors.phone && (
                      <p className="text-sm text-[#e8a020] font-medium">{errors.phone.message}</p>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  연락처 정보는 프로필에 공개됩니다. 원하지 않으면 비워두세요.
                </p>
              </section>

              {/* 프로필 사진 */}
              <section className="space-y-6">
                <h2 className="border-b border-[#e8a020]/30 pb-2 text-xl font-bold film-gold">
                  프로필 사진
                </h2>
                
                {/* 프로필 사진 미리보기 */}
                <div className="flex justify-center">
                  <div className="relative h-64 w-64 rounded-full overflow-hidden border-4 border-[#e8a020]/30 shadow-2xl">
                    {photoPreview || watch("mainPhotoUrl") ? (
                      <img
                        src={photoPreview || watch("mainPhotoUrl") || ""}
                        alt="프로필 미리보기"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <span className="text-7xl">🎭</span>
                      </div>
                    )}
                    {uploadingPhoto && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#e8a020] border-t-transparent" />
                          <span className="text-sm text-[#e8a020]">업로드 중...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 드래그 앤 드롭 영역 */}
                <div
                  ref={dropZoneRef}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith("image/")) {
                      await handleFileUpload(file);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all ${
                    isDragging
                      ? "border-[#e8a020]/100 bg-[#100e0a]/20"
                      : "border-[#5a5248]/40 bg-[#181410]800/30 hover:border-[#e8a020]/50 hover:bg-[#e8a020]/10"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        await handleFileUpload(file);
                      }
                    }}
                    className="hidden"
                  />
                  
                  <div className="p-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8a020]/10">
                      <span className="text-3xl">📸</span>
                    </div>
                    <p className="mb-2 text-lg font-medium text-gray-200">
                      {uploadingPhoto ? "업로드 중..." : "이미지를 드래그하거나 클릭하여 업로드"}
                    </p>
                    <p className="text-sm text-[#8a807a]">
                      PNG, JPG, GIF 최대 5MB
                    </p>
                  </div>
                </div>

                {/* URL 입력 (대안) */}
                <div className="space-y-2">
                  <Label htmlFor="mainPhotoUrl" className="text-sm font-medium text-[#8a807a]">
                    또는 이미지 URL 직접 입력
                  </Label>
                  <Input
                    id="mainPhotoUrl"
                    type="url"
                    placeholder="https://example.com/photo.jpg"
                    className="bg-[#181410] border-[#5a5248]/40 text-[#faf6f0] transition-all focus:border-[#e8a020] focus:ring-2 focus:ring-[#e8a020]/20"
                    {...register("mainPhotoUrl")}
                    onChange={(e) => {
                      setValue("mainPhotoUrl", e.target.value);
                      setPhotoPreview(null);
                      if (e.target.value) {
                        setValue("mainPhotoPath", "");
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500">
                    외부 이미지 호스팅 서비스(Imgur, Cloudinary 등)의 이미지 URL을 입력하세요
                  </p>
                </div>
              </section>

              {/* 데모 릴 */}
              <section className="space-y-4">
                <h2 className="border-b border-[#e8a020]/30 pb-2 text-xl font-bold film-gold">
                  데모 릴
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="demoPlatform" className="text-[#8a807a]">
                      플랫폼
                    </Label>
                    <Select
                      value={watch("demoPlatform") || undefined}
                      onValueChange={(value) =>
                        setValue("demoPlatform", value === "none" ? undefined : (value as "youtube" | "vimeo"))
                      }
                    >
                      <SelectTrigger className="bg-[#181410] border-[#5a5248]/40 text-[#faf6f0]">
                        <SelectValue placeholder="선택 안 함" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#181410]900 border-[#e8a020]/30">
                        <SelectItem value="none" className="text-[#e8a020] hover:bg-[#e8a020]/10 focus:bg-[#e8a020]/10 cursor-pointer">선택 안 함</SelectItem>
                        <SelectItem value="youtube" className="text-[#e8a020] hover:bg-[#e8a020]/10 focus:bg-[#e8a020]/10 cursor-pointer">YouTube</SelectItem>
                        <SelectItem value="vimeo" className="text-[#e8a020] hover:bg-[#e8a020]/10 focus:bg-[#e8a020]/10 cursor-pointer">Vimeo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="demoUrl" className="text-[#8a807a]">
                      데모 릴 URL
                    </Label>
                    <Input
                      id="demoUrl"
                      type="url"
                      placeholder="https://youtube.com/watch?v=..."
                      className="bg-[#181410] border-[#5a5248]/40 text-[#faf6f0]"
                      {...register("demoUrl")}
                    />
                  </div>
                </div>
              </section>

              {/* 경력 */}
              <section className="space-y-4">
                <h2 className="border-b border-[#e8a020]/30 pb-2 text-xl font-bold film-gold">
                  연기 경력
                </h2>
                {experienceFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      placeholder="예: 단편영화 '제목' 주연, 연극 '제목' 조연"
                      className="bg-[#181410] border-[#5a5248]/40 text-[#faf6f0]"
                      {...register(`experience.${index}`)}
                    />
                    {experienceFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeExperience(index)}
                        className="border-[#5a5248]/40 text-[#8a807a] hover:bg-[#e8a020]/10"
                      >
                        삭제
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendExperience("")}
                  className="border-[#e8a020]/50 text-[#e8a020] hover:bg-[#e8a020]/10"
                >
                  경력 추가
                </Button>
              </section>

              {/* 스킬 */}
              <section className="space-y-4">
                <h2 className="border-b border-[#e8a020]/30 pb-2 text-xl font-bold film-gold">
                  특기 / 스킬
                </h2>
                {skillFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      placeholder="예: 액션, 댄스, 노래, 악기 연주"
                      className="bg-[#181410] border-[#5a5248]/40 text-[#faf6f0]"
                      {...register(`skills.${index}`)}
                    />
                    {skillFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeSkill(index)}
                        className="border-[#5a5248]/40 text-[#8a807a] hover:bg-[#e8a020]/10"
                      >
                        삭제
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendSkill("")}
                  className="border-[#e8a020]/50 text-[#e8a020] hover:bg-[#e8a020]/10"
                >
                  스킬 추가
                </Button>
              </section>

              {/* MBTI */}
              <section className="space-y-4">
                <Label htmlFor="mbti" className="text-[#e8a020] font-semibold">
                  MBTI (선택)
                </Label>
                <Input
                  id="mbti"
                  {...register("mbti")}
                  placeholder="예: ENFP, ISTJ"
                  maxLength={4}
                  className="bg-[#181410] border-[#5a5248]/40 text-[#faf6f0] placeholder:text-gray-500"
                />
                {errors.mbti && (
                  <p className="text-[#e8a020] text-sm">{errors.mbti.message}</p>
                )}
                <p className="text-xs text-gray-500">
                  MBTI 성격 유형을 입력하세요 (선택사항)
                </p>
              </section>

              {/* 특성 점수 */}
              <section className="space-y-4">
                <Label className="text-[#e8a020] font-semibold">
                  특성 점수 (0-100)
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "acting", label: "연기력" },
                    { key: "appearance", label: "외모" },
                    { key: "charisma", label: "카리스마" },
                    { key: "emotion", label: "감성" },
                    { key: "humor", label: "유머" },
                    { key: "action", label: "액션" },
                  ].map(({ key, label }) => (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-[#8a807a] text-sm">{label}</Label>
                        <span className="text-[#e8a020] text-sm font-semibold">
                          {watch(`traits.${key}` as any) || 50}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={watch(`traits.${key}` as any) || 50}
                        onChange={(e) =>
                          setValue(`traits.${key}` as any, Number(e.target.value))
                        }
                        className="w-full h-2 bg-[#181410]700 rounded-lg appearance-none cursor-pointer accent-[#e8a020]"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500">
                  각 특성에 대한 자신의 점수를 0-100 사이로 설정하세요
                </p>
              </section>

              {/* 공개 설정 */}
              <section className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg border border-[#e8a020]/20 bg-[#e8a020]/5 p-4">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setValue("isPublic", e.target.checked)}
                    className="h-5 w-5 rounded border-[#5a5248]/40 bg-[#181410]800 text-[#e8a020] focus:ring-[#e8a020] cursor-pointer"
                  />
                  <Label htmlFor="isPublic" className="text-[#8a807a] cursor-pointer">
                    <span className="font-semibold text-[#e8a020]">프로필 공개</span>
                    <span className="block text-sm text-[#8a807a] mt-1">
                      프로필을 공개하면 제작자들이 검색하여 찾을 수 있습니다
                    </span>
                  </Label>
                </div>
                {!isPublic && (
                  <p className="text-sm text-[#e8a020]/80 bg-[#e8a020]/10 border border-[#e8a020]/20 rounded p-3">
                    ⚠️ 프로필이 비공개 상태입니다. 공개 설정을 체크하면 배우 목록에 표시됩니다.
                  </p>
                )}
              </section>

              {/* 제출 버튼 */}
              <div className="flex gap-4 border-t border-[#e8a020]/20 pt-6">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 btn-primary-gradient"
                >
                  {saving ? "저장 중..." : "프로필 저장"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/actors/me/view")}
                  className="border-[#5a5248]/40 text-[#8a807a] hover:bg-[#e8a020]/10"
                >
                  취소
                </Button>
              </div>
              
              {/* 안내 메시지 */}
              {isPublic && (
                <div className="rounded-lg border border-green-600/30 bg-green-600/10 p-4">
                  <p className="text-sm text-green-400">
                    ✅ 프로필이 공개되어 있습니다. 저장 후 배우 목록에서 확인할 수 있습니다.
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
