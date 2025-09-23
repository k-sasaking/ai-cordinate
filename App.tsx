
import React, { useState, useCallback } from 'react';
import { AppStep, ClothingItem, UserProfile } from './types';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import Loader from './components/Loader';
import Stepper from './components/Stepper';
import ClothingGallery from './components/ClothingGallery';
import { clothingItems } from './data/clothingItems';
import { generateFullBodyImage, generateTryOnImage, analyzeUserProfile } from './services/geminiService';
import { ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, LinkIcon } from './components/Icons';

// Helper to convert image URL to Base64
const urlToBase64 = async (url: string): Promise<string> => {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};


const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.UPLOAD_PROFILE);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [fullBodyImage, setFullBodyImage] = useState<string | null>(null);
  const [clothingImage, setClothingImage] = useState<string | null>(null);
  const [generatedOutfits, setGeneratedOutfits] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const STEPS = [
    { id: AppStep.UPLOAD_PROFILE, name: 'プロフィール写真' },
    { id: AppStep.GENERATE_BODY, name: '全身画像を生成' },
    { id: AppStep.UPLOAD_CLOTHES, name: '商品を選択' },
    { id: AppStep.GENERATE_OUTFIT, name: 'コーデを生成' },
    { id: AppStep.RESULTS, name: '結果' },
  ];

  const handleReset = () => {
    setCurrentStep(AppStep.UPLOAD_PROFILE);
    setProfileImage(null);
    setUserProfile(null);
    setFullBodyImage(null);
    setClothingImage(null);
    setGeneratedOutfits([]);
    setError(null);
    setIsLoading(false);
  };

  const handleProfileImageUpload = async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
        const base64Image = reader.result as string;
        setProfileImage(base64Image);
        setError(null);
        setIsLoading(true);
        setLoadingMessage('AIがプロフィールを分析中です...');
        try {
            const profileData = await analyzeUserProfile(base64Image);
            setUserProfile(profileData);
            setCurrentStep(AppStep.GENERATE_BODY);
        } catch (err) {
            console.error(err);
            setError("プロフィールの分析に失敗しました。もう一度お試しください。");
            setProfileImage(null);
            setCurrentStep(AppStep.UPLOAD_PROFILE);
        } finally {
            setIsLoading(false);
        }
    };
    reader.onerror = () => {
        setError("画像の読み込みに失敗しました。");
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateFullBody = useCallback(async () => {
    if (!profileImage) return;
    setIsLoading(true);
    setLoadingMessage('AIが全身画像を生成中です...');
    setError(null);
    try {
      const generatedImage = await generateFullBodyImage(profileImage);
      setFullBodyImage(generatedImage);
      setCurrentStep(AppStep.UPLOAD_CLOTHES);
    } catch (err) {
      console.error(err);
      setError("全身画像の生成に失敗しました。もう一度お試しください。");
      setCurrentStep(AppStep.GENERATE_BODY);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [profileImage]);

  const handleClothingSelection = useCallback(async (item: ClothingItem) => {
    setIsLoading(true);
    setLoadingMessage('服の画像を準備中です...');
    setError(null);
    try {
        const base64Image = await urlToBase64(item.imageUrl);
        setClothingImage(base64Image);
        setCurrentStep(AppStep.GENERATE_OUTFIT);
    } catch (err) {
        console.error(err);
        setError("服の画像の読み込みに失敗しました。別の服を選択してください。");
    } finally {
        setIsLoading(false);
    }
  }, []);

  const handleGenerateOutfits = useCallback(async () => {
    if (!fullBodyImage || !clothingImage) return;
    setIsLoading(true);
    setLoadingMessage('AIがコーデを生成中... 少々お待ちください。');
    setError(null);
    try {
      const angles = [
        { name: '正面', prompt: 'from the front' },
        { name: '45度', prompt: 'from a 45-degree angle' }
      ];

      const imagePromises = angles.map(angle =>
        generateTryOnImage(fullBodyImage, clothingImage, angle.prompt)
      );

      const results = await Promise.all(imagePromises);
      setGeneratedOutfits(results);
      setCurrentStep(AppStep.RESULTS);
    } catch (err) {
      console.error(err);
      setError("コーディネート画像の生成に失敗しました。もう一度お試しください。");
      setCurrentStep(AppStep.UPLOAD_CLOTHES);
      setClothingImage(null);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [fullBodyImage, clothingImage]);
  
  const renderStepContent = () => {
    if (isLoading) {
      return <Loader message={loadingMessage} />;
    }

    switch (currentStep) {
      case AppStep.UPLOAD_PROFILE:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-2">ステップ1: プロフィール写真</h2>
            <p className="text-gray-500 mb-6">あなたの顔がはっきりと写っている写真をアップロードしてください。</p>
            <ImageUploader onImageUpload={handleProfileImageUpload} />
          </div>
        );
      case AppStep.GENERATE_BODY:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-2">全身画像を生成しますか？</h2>
            <p className="text-gray-500 mb-6">アップロードされた写真をもとに、AIがあなたの全身画像を生成します。</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-6">
              {profileImage && <img src={profileImage} alt="Profile Preview" className="rounded-lg shadow-md w-48 h-48 object-cover" />}
              {userProfile && (
                <div className="bg-gray-50 p-4 rounded-lg text-left shadow-inner">
                  <h3 className="font-semibold text-gray-600 mb-2">AIによるプロフィール分析</h3>
                  <p className="text-gray-800"><span className="font-medium">推定年齢:</span> {userProfile.age}歳</p>
                  <p className="text-gray-800"><span className="font-medium">推定性別:</span> {userProfile.gender}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleGenerateFullBody}
              className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              生成を開始
            </button>
          </div>
        );
      case AppStep.UPLOAD_CLOTHES:
        return (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-700 mb-2">ステップ2: 着せたい服</h2>
             <p className="text-gray-500 mb-6">試着したい服を下のリストから選んでください。</p>
            <div className="flex justify-center items-start gap-8">
               <div className="text-center hidden md:block">
                 <h3 className="font-semibold text-gray-600 mb-2">あなたの全身画像</h3>
                 {fullBodyImage && <img src={fullBodyImage} alt="Full Body" className="rounded-lg shadow-md w-48 h-72 object-cover bg-gray-200" />}
               </div>
               <div className="flex-grow max-w-lg">
                  <ClothingGallery items={clothingItems} onSelect={handleClothingSelection} />
               </div>
            </div>
          </div>
        );
      case AppStep.GENERATE_OUTFIT:
          return (
             <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-700 mb-4">コーデを生成しますか？</h2>
              <p className="text-gray-500 mb-6">AIが2つの角度からコーディネート画像を生成します。</p>
              <div className="flex flex-wrap gap-4 items-center justify-center mb-6">
                 {fullBodyImage && <img src={fullBodyImage} alt="Full Body" className="rounded-lg shadow-md w-40 h-64 object-cover" />}
                 <div className="text-3xl text-gray-400 font-light">+</div>
                 {clothingImage && <img src={clothingImage} alt="Clothing" className="rounded-lg shadow-md w-40 h-64 object-contain bg-white p-2" />}
              </div>
              <button
                onClick={handleGenerateOutfits}
                className="w-full bg-pink-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-pink-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
              >
                コーディネート生成
              </button>
            </div>
        );
      case AppStep.RESULTS:
        return (
            <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <CheckCircleIcon className="w-8 h-8 text-green-500" />
                    <h2 className="text-2xl font-bold text-gray-700">AIコーディネートが完成しました！</h2>
                </div>
                <p className="text-gray-500 mb-8">2つの角度からの試着イメージをご確認ください。</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {generatedOutfits.map((outfit, index) => (
                        <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
                            <img src={outfit} alt={`Generated Outfit ${index + 1}`} className="w-full h-auto object-cover" />
                            <div className="p-3 bg-gray-50">
                                <p className="text-center font-semibold text-gray-600">
                                    {['正面', '45度'][index]}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                 <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={() => window.open('https://example.com/purchase', '_blank')}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                        <LinkIcon className="w-5 h-5"/>
                        この服を購入する
                    </button>
                    <button
                        onClick={handleReset}
                        className="w-full flex items-center justify-center gap-2 bg-gray-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                        <ArrowPathIcon className="w-5 h-5"/>
                        はじめからやり直す
                    </button>
                </div>
            </div>
        );
      default:
        return null;
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <Stepper steps={STEPS} currentStep={currentStep} />
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 flex items-start gap-3" role="alert">
              <ExclamationTriangleIcon className="w-6 h-6 flex-shrink-0 mt-0.5"/>
              <div>
                <p className="font-bold">エラーが発生しました</p>
                <p>{error}</p>
              </div>
            </div>
          )}
          <div className="mt-8 min-h-[400px] flex items-center justify-center">
             {renderStepContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
