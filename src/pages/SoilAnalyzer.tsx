
import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp, Camera, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { soilAnalyzerTranslations } from "@/constants/allTranslations";

const SoilAnalyzer = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [manualValues, setManualValues] = useState({
    ph: "",
    nitrogen: "",
    phosphorus: "",
    potassium: "",
    organic: "",
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      toast({
        title: "Image uploaded",
        description: "Your soil test report has been uploaded successfully.",
      });
    }
  };

  const handleManualInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setManualValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleAnalyzeImage = () => {
    if (!uploadedImage) {
      toast({
        title: "No image",
        description: "Please upload a soil test report image first.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate analysis processing
    setTimeout(() => {
      setIsAnalyzing(false);
      toast({
        title: "Analysis Complete",
        description: "Your soil test report has been analyzed. View results below.",
      });
    }, 2000);
  };

  const handleAnalyzeManual = () => {
    const { ph, nitrogen, phosphorus, potassium } = manualValues;
    
    if (!ph || !nitrogen || !phosphorus || !potassium) {
      toast({
        title: "Missing values",
        description: "Please enter at least the pH, N, P, and K values.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate analysis processing
    setTimeout(() => {
      setIsAnalyzing(false);
      toast({
        title: "Analysis Complete",
        description: "Your soil data has been analyzed. View results below.",
      });
    }, 1500);
  };

  return (
    <Layout>
      <section className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {t(soilAnalyzerTranslations.title)}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t(soilAnalyzerTranslations.subtitle)}
            </p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Tabs defaultValue="upload">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="upload">{t(soilAnalyzerTranslations.uploadTab)}</TabsTrigger>
                <TabsTrigger value="manual">{t(soilAnalyzerTranslations.manualTab)}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload">
                <Card>
                  <CardHeader>
                    <CardTitle>{t(soilAnalyzerTranslations.uploadTitle)}</CardTitle>
                    <CardDescription>
                      {t(soilAnalyzerTranslations.uploadDescription)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-lg p-8 mb-6">
                      {uploadedImage ? (
                        <div className="w-full">
                          <img 
                            src={uploadedImage} 
                            alt="Uploaded soil test report" 
                            className="max-h-[300px] mx-auto mb-4"
                          />
                          <div className="text-center text-sm text-muted-foreground">
                            <p>Image uploaded successfully</p>
                            <Button 
                              variant="ghost" 
                              className="mt-2"
                              onClick={() => setUploadedImage(null)}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="mb-4">
                            <Upload className="h-10 w-10 text-muted-foreground mx-auto" />
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            Drag and drop your report image here or click buttons below
                          </p>
                          <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Button className="gap-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <Camera className="h-4 w-4" />
                                <span>{t(soilAnalyzerTranslations.takePhoto)}</span>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  capture="environment"
                                  className="hidden"
                                  onChange={handleImageUpload}
                                />
                              </label>
                            </Button>
                            <Button variant="outline" className="gap-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <FileUp className="h-4 w-4" />
                                <span>{t(soilAnalyzerTranslations.uploadFile)}</span>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={handleImageUpload}
                                />
                              </label>
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={handleAnalyzeImage}
                      disabled={!uploadedImage || isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <span className="loading-dots">{t(soilAnalyzerTranslations.analyzing)}</span>
                      ) : (
                        t(soilAnalyzerTranslations.analyzeReport)
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="manual">
                <Card>
                  <CardHeader>
                    <CardTitle>{t(soilAnalyzerTranslations.manualTitle)}</CardTitle>
                    <CardDescription>
                      {t(soilAnalyzerTranslations.manualDescription)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label htmlFor="ph" className="text-sm font-medium">
                          {t(soilAnalyzerTranslations.soilPH)}
                        </label>
                        <Input
                          id="ph"
                          name="ph"
                          type="number"
                          step="0.1"
                          min="0"
                          max="14"
                          placeholder="e.g. 6.5"
                          value={manualValues.ph}
                          onChange={handleManualInputChange}
                        />
                        <p className="text-xs text-muted-foreground">
                          Value typically between 0-14
                        </p>
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="nitrogen" className="text-sm font-medium">
                          {t(soilAnalyzerTranslations.nitrogen)}
                        </label>
                        <Input
                          id="nitrogen"
                          name="nitrogen"
                          type="number"
                          placeholder="e.g. 280"
                          value={manualValues.nitrogen}
                          onChange={handleManualInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="phosphorus" className="text-sm font-medium">
                          {t(soilAnalyzerTranslations.phosphorus)}
                        </label>
                        <Input
                          id="phosphorus"
                          name="phosphorus"
                          type="number"
                          placeholder="e.g. 45"
                          value={manualValues.phosphorus}
                          onChange={handleManualInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="potassium" className="text-sm font-medium">
                          {t(soilAnalyzerTranslations.potassium)}
                        </label>
                        <Input
                          id="potassium"
                          name="potassium"
                          type="number"
                          placeholder="e.g. 190"
                          value={manualValues.potassium}
                          onChange={handleManualInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="organic" className="text-sm font-medium">
                          {t(soilAnalyzerTranslations.organicMatter)}
                        </label>
                        <Input
                          id="organic"
                          name="organic"
                          type="number"
                          step="0.1"
                          placeholder="e.g. 2.1"
                          value={manualValues.organic}
                          onChange={handleManualInputChange}
                        />
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      onClick={handleAnalyzeManual}
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <span className="loading-dots">{t(soilAnalyzerTranslations.analyzing)}</span>
                      ) : (
                        t(soilAnalyzerTranslations.analyzeData)
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="mt-12 border-t border-border pt-8">
              <h2 className="text-2xl font-bold mb-6">{t(soilAnalyzerTranslations.yourAnalysis)}</h2>
              
              <p className="text-muted-foreground text-center py-12">
                {t(soilAnalyzerTranslations.analysisPlaceholder)}
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default SoilAnalyzer;
