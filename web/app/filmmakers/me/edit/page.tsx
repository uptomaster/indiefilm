"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Zod 에러 메시지를 한글로 설정
z.setErrorMap((issue, ctx) => {
  if (issue.code === z.ZodIssueCode.invalid_enum_value) {
    if (issue.path[0] === "type") {
      return { message: "유형을 선택해주세요 (개인 또는 팀)" };
    }
    return { message: "올바른 값을 선택해주세요" };
  }
  if (issue.code === z.ZodIssueCode.invalid_type && issue.expected === "number") {
    return { message: "숫자로 입력해주세요" };
  }
  return { message: ctx.defaultError };
});
import { useAuth } from "@/hooks/useAuth";
import {
  getFilmmakerByUserId,
  createOrUpdateFilmmakerProfile,
  FilmmakerType,
} from "@/lib/filmmakers";
import { uploadImage } from "@/lib/storage";
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

const filmmakerSchema = z.object({
  type: z.enum(["individual", "team"], {
    required_error: "유형을 선택해주세요",
    invalid_type_error: "유형을 선택해주세요",
  }),
  name: z.string({
    required_error: "이름을 입력해주세요",
    invalid_type_error: "이름을 입력해주세요",
  }).min(1, "이름을 입력해주세요"),
  bio: z.string({
    invalid_type_error: "소개를 입력해주세요",
  }).optional().or(z.literal("")),
  location: z.string({
    invalid_type_error: "지역을 입력해주세요",
  }).optional().or(z.literal("")),
  website: z.string().url("올바른 URL 형식을 입력해주세요").optional().or(z.literal("")),
  email: z.string().email("올바른 이메일 형식을 입력해주세요").optional().or(z.literal("")),
  phone: z.string({
    invalid_type_error: "전화번호를 입력해주세요",
  }).optional().or(z.literal("")),
  specialties: z.array(z.string()).optional(),
  equipment: z.array(z.string()).optional(),
  experience: z.array(z.string()).optional(),
  mainPhotoUrl: z.string().url("올바른 URL 형식을 입력해주세요").optional().or(z.literal("")),
  mainPhotoPath: z.string().optional(),
  gallery: z.array(
    z.object({
      url: z.string().url("올바른 URL 형식을 입력해주세요"),
      path: z.string(),
    })
  ).optional(),
  teamMembers: z.array(
    z.object({
      name: z.string().min(1, "이름을 입력해주세요"),
      role: z.string().min(1, "역할을 입력해주세요"),
      profileLink: z.string().url("올바른 URL 형식을 입력해주세요").optional().or(z.literal("")),
    })
  ).optional(),
  isPublic: z.boolean({
    required_error: "공개 설정을 선택해주세요",
    invalid_type_error: "공개 설정을 선택해주세요",
  }),
});

type FilmmakerForm = z.infer<typeof filmmakerSchema>;

const locations = ["서울", "부산", "인천", "대구", "광주", "대전", "울산", "기타"];

export default function FilmmakerProfileEditPage() {
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
  } = useForm<FilmmakerForm>({
    resolver: zodResolver(filmmakerSchema),
    defaultValues: {
      type: "individual",
      specialties: [],
      equipment: [],
      experience: [],
      gallery: [],
      teamMembers: [],
      isPublic: true,
    },
  });

  const {
    fields: specialtyFields,
    append: appendSpecialty,
    remove: removeSpecialty,
  } = useFieldArray({
    control,
    name: "specialties",
  });

  const {
    fields: equipmentFields,
    append: appendEquipment,
    remove: removeEquipment,
  } = useFieldArray({
    control,
    name: "equipment",
  });

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
  } = useFieldArray({
    control,
    name: "experience",
  });

  const {
    fields: teamMemberFields,
    append: appendTeamMember,
    remove: removeTeamMember,
  } = useFieldArray({
    control,
    name: "teamMembers",
  });

  const filmmakerType = watch("type");
  const isPublic = watch("isPublic");
  const mainPhotoUrl = watch("mainPhotoUrl");

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
        router.push("/role-select");
        return;
      }
      loadProfile();
    }
  }, [user, userProfile, authLoading]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const filmmakerData = await getFilmmakerByUserId(user.uid);
      if (filmmakerData) {
        setValue("type", filmmakerData.type);
        setValue("name", filmmakerData.name);
        setValue("bio", filmmakerData.bio || "");
        setValue("location", filmmakerData.location || "");
        setValue("website", filmmakerData.website || "");
        setValue("email", filmmakerData.email || "");
        setValue("phone", filmmakerData.phone || "");
        setValue("specialties", filmmakerData.specialties || []);
        setValue("equipment", filmmakerData.equipment || []);
        setValue("experience", filmmakerData.experience || []);
        setValue("mainPhotoUrl", filmmakerData.mainPhotoUrl || "");
        setValue("mainPhotoPath", filmmakerData.mainPhotoPath || "");
        setValue("gallery", filmmakerData.gallery || []);
        setValue("teamMembers", filmmakerData.teamMembers || []);
        setValue("isPublic", filmmakerData.isPublic);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FilmmakerForm) => {
    if (!user) {
      router.push("/login");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await createOrUpdateFilmmakerProfile(user.uid, {
        type: data.type,
        name: data.name,
        bio: data.bio && data.bio.trim() !== "" ? data.bio : undefined,
        location: data.location && data.location.trim() !== "" ? data.location : undefined,
        website: data.website && data.website.trim() !== "" ? data.website : undefined,
        email: data.email && data.email.trim() !== "" ? data.email : undefined,
        phone: data.phone && data.phone.trim() !== "" ? data.phone : undefined,
        specialties: data.specialties?.filter((s) => s.trim() !== "") || undefined,
        equipment: data.equipment?.filter((e) => e.trim() !== "") || undefined,
        experience: data.experience?.filter((e) => e.trim() !== "") || undefined,
        mainPhotoUrl: data.mainPhotoUrl && data.mainPhotoUrl.trim() !== "" ? data.mainPhotoUrl : undefined,
        mainPhotoPath: data.mainPhotoPath || undefined,
        gallery: data.gallery || [],
        teamMembers: data.teamMembers?.filter((m) => m.name.trim() !== "" && m.role.trim() !== "") || undefined,
        isPublic: data.isPublic,
      });

      alert("프로필이 저장되었습니다!");
      router.push("/filmmakers/me/view");
    } catch (err: any) {
      setError(err.message || "프로필 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (file: File) => {
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
      const path = `filmmakers/${user.uid}/main_${Date.now()}.${file.name.split('.').pop()}`;
      const url = await uploadImage(file, path);
      setValue("mainPhotoUrl", url);
      setValue("mainPhotoPath", path);
      setPhotoPreview(null); // 업로드 완료 후 미리보기 제거
    } catch (error: any) {
      console.error("업로드 에러:", error);
      const errorMessage = error.message || "이미지 업로드에 실패했습니다.";
      setError(errorMessage);
      setPhotoPreview(null);
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-yellow-600 border-t-transparent" />
            <p className="mt-4 text-gray-400">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <Card className="border-yellow-600/20 bg-gray-900/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-2xl film-gold">제작자 프로필</CardTitle>
            <CardDescription className="text-gray-400">
              제작자 프로필을 작성해주세요
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-6 rounded-md bg-red-900/20 border border-red-600/30 p-4 text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 기본 정보 */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-yellow-400 border-b border-yellow-600/30 pb-2">
                  기본 정보
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="type" className="text-gray-300">유형 *</Label>
                  <Select
                    value={filmmakerType}
                    onValueChange={(value) => setValue("type", value as FilmmakerType)}
                  >
                    <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                      <SelectValue placeholder="유형 선택" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-900 border-yellow-600/30">
                      <SelectItem value="individual" className="text-yellow-400 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
                        개인
                      </SelectItem>
                      <SelectItem value="team" className="text-yellow-400 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
                        팀
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300">
                    {filmmakerType === "team" ? "팀 이름" : "이름"} *
                  </Label>
                  <Input
                    id="name"
                    className="bg-gray-800/50 border-gray-700 text-white"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-400">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-gray-300">소개</Label>
                  <textarea
                    id="bio"
                    rows={4}
                    className="w-full rounded-md border border-gray-700 bg-gray-800/50 px-3 py-2 text-sm text-white placeholder:text-gray-500"
                    {...register("bio")}
                    placeholder="제작자 또는 팀에 대한 소개를 작성해주세요"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="text-gray-300">지역</Label>
                    <Select
                      value={watch("location") || "none"}
                      onValueChange={(value) =>
                        setValue("location", value === "none" ? "" : value)
                      }
                    >
                      <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                        <SelectValue placeholder="지역 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-900 border-yellow-600/30">
                        <SelectItem value="none" className="text-yellow-400 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
                          선택 안 함
                        </SelectItem>
                        {locations.map((loc) => (
                          <SelectItem key={loc} value={loc} className="text-yellow-400 hover:bg-gray-800 focus:bg-gray-800 cursor-pointer">
                            {loc}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-gray-300">웹사이트</Label>
                    <Input
                      id="website"
                      type="url"
                      className="bg-gray-800/50 border-gray-700 text-white"
                      placeholder="https://..."
                      {...register("website")}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-gray-300">이메일</Label>
                    <Input
                      id="email"
                      type="email"
                      className="bg-gray-800/50 border-gray-700 text-white"
                      placeholder="contact@example.com"
                      {...register("email")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-gray-300">전화번호</Label>
                    <Input
                      id="phone"
                      type="tel"
                      className="bg-gray-800/50 border-gray-700 text-white"
                      placeholder="010-1234-5678"
                      {...register("phone")}
                    />
                  </div>
                </div>
              </section>

              {/* 프로필 사진 */}
              <section className="space-y-6">
                <h3 className="text-xl font-bold text-yellow-400 border-b border-yellow-600/30 pb-2">
                  프로필 사진
                </h3>

                {/* 프로필 사진 미리보기 */}
                <div className="flex justify-center">
                  <div className="relative h-64 w-64 rounded-full overflow-hidden border-4 border-yellow-600/30 shadow-2xl">
                    {photoPreview || mainPhotoUrl ? (
                      <img
                        src={photoPreview || mainPhotoUrl || ""}
                        alt="프로필 미리보기"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                        <span className="text-7xl">🎬</span>
                      </div>
                    )}
                    {uploadingPhoto && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-600 border-t-transparent" />
                          <span className="text-sm text-yellow-400">업로드 중...</span>
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
                      await handlePhotoUpload(file);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all ${
                    isDragging
                      ? "border-yellow-500 bg-yellow-900/20"
                      : "border-gray-700 bg-gray-800/30 hover:border-yellow-600/50 hover:bg-gray-800/50"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        await handlePhotoUpload(file);
                      }
                    }}
                    className="hidden"
                  />
                  
                  <div className="p-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-600/10">
                      <span className="text-3xl">📸</span>
                    </div>
                    <p className="mb-2 text-lg font-medium text-gray-200">
                      {uploadingPhoto ? "업로드 중..." : "이미지를 드래그하거나 클릭하여 업로드"}
                    </p>
                    <p className="text-sm text-gray-400">
                      PNG, JPG, GIF 최대 5MB
                    </p>
                  </div>
                </div>

                {/* URL 입력 (대안) */}
                <div className="space-y-2">
                  <Label htmlFor="mainPhotoUrl" className="text-sm font-medium text-gray-400">
                    또는 이미지 URL 직접 입력
                  </Label>
                  <Input
                    id="mainPhotoUrl"
                    className="bg-gray-800/50 border-gray-700 text-white transition-all focus:border-yellow-600 focus:ring-2 focus:ring-yellow-600/20"
                    placeholder="https://example.com/image.jpg"
                    {...register("mainPhotoUrl")}
                    onChange={(e) => {
                      setValue("mainPhotoUrl", e.target.value);
                      setPhotoPreview(null);
                    }}
                  />
                  <p className="text-xs text-gray-500">
                    외부 이미지 호스팅 서비스(Imgur, Cloudinary 등)의 이미지 URL을 입력하세요
                  </p>
                </div>
              </section>

              {/* 전문 분야 */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-yellow-400 border-b border-yellow-600/30 pb-2">
                  전문 분야
                </h3>
                {specialtyFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      className="bg-gray-800/50 border-gray-700 text-white"
                      placeholder="예: 단편영화, 다큐멘터리"
                      {...register(`specialties.${index}`)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      onClick={() => removeSpecialty(index)}
                    >
                      삭제
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="border-yellow-600/50 text-yellow-400 hover:bg-yellow-600/10"
                  onClick={() => appendSpecialty("")}
                >
                  전문 분야 추가
                </Button>
              </section>

              {/* 보유 장비 */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-yellow-400 border-b border-yellow-600/30 pb-2">
                  보유 장비
                </h3>
                {equipmentFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      className="bg-gray-800/50 border-gray-700 text-white"
                      placeholder="예: Sony FX3, Canon 5D Mark IV"
                      {...register(`equipment.${index}`)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      onClick={() => removeEquipment(index)}
                    >
                      삭제
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="border-yellow-600/50 text-yellow-400 hover:bg-yellow-600/10"
                  onClick={() => appendEquipment("")}
                >
                  장비 추가
                </Button>
              </section>

              {/* 경력 */}
              <section className="space-y-4">
                <h3 className="text-xl font-bold text-yellow-400 border-b border-yellow-600/30 pb-2">
                  경력
                </h3>
                {experienceFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      className="bg-gray-800/50 border-gray-700 text-white"
                      placeholder="예: 2020년 단편영화 '제목' 감독"
                      {...register(`experience.${index}`)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      onClick={() => removeExperience(index)}
                    >
                      삭제
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="border-yellow-600/50 text-yellow-400 hover:bg-yellow-600/10"
                  onClick={() => appendExperience("")}
                >
                  경력 추가
                </Button>
              </section>

              {/* 팀 멤버 (팀인 경우만) */}
              {filmmakerType === "team" && (
                <section className="space-y-4">
                  <h3 className="text-xl font-bold text-yellow-400 border-b border-yellow-600/30 pb-2">
                    팀 멤버
                  </h3>
                  {teamMemberFields.map((field, index) => (
                    <div key={field.id} className="space-y-2 rounded-lg border border-gray-700/50 bg-gray-800/30 p-4">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          className="bg-gray-800/50 border-gray-700 text-white"
                          placeholder="이름"
                          {...register(`teamMembers.${index}.name`)}
                        />
                        <Input
                          className="bg-gray-800/50 border-gray-700 text-white"
                          placeholder="역할 (예: 감독)"
                          {...register(`teamMembers.${index}.role`)}
                        />
                      </div>
                      <Input
                        className="bg-gray-800/50 border-gray-700 text-white"
                        placeholder="프로필 링크 (선택)"
                        {...register(`teamMembers.${index}.profileLink`)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
                        onClick={() => removeTeamMember(index)}
                      >
                        삭제
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    className="border-yellow-600/50 text-yellow-400 hover:bg-yellow-600/10"
                    onClick={() => appendTeamMember({ name: "", role: "", profileLink: "" })}
                  >
                    팀 멤버 추가
                  </Button>
                </section>
              )}

              {/* 공개 설정 */}
              <section className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg border border-yellow-600/20 bg-yellow-600/5 p-4">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={isPublic}
                    onChange={(e) => setValue("isPublic", e.target.checked)}
                    className="h-5 w-5 rounded border-gray-700 bg-gray-800 text-yellow-600 focus:ring-yellow-600 cursor-pointer"
                  />
                  <Label htmlFor="isPublic" className="text-gray-300 cursor-pointer">
                    <span className="font-semibold text-yellow-400">프로필 공개</span>
                    <span className="block text-sm text-gray-400 mt-1">
                      프로필을 공개하면 다른 사용자들이 검색하여 찾을 수 있습니다
                    </span>
                  </Label>
                </div>
              </section>

              {/* 제출 버튼 */}
              <div className="flex gap-4 border-t border-yellow-600/20 pt-6">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-yellow-600 text-black hover:bg-yellow-500"
                >
                  {saving ? "저장 중..." : "프로필 저장"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/filmmakers/me/view")}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
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
