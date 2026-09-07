import mongoose from 'mongoose';
import { AIService } from './ai.service';
import { Application, IApplication } from '../models/application.model';
import { User } from '../models/user.model';
import { BusinessExtractionResult } from '../ai/schemas/business.schema';
import { AppError } from '../utils/appError';

export interface IntakeAnalysisResult {
  applicationId: string;
  business: BusinessExtractionResult;
  isMock?: boolean;
}

export class IntakeService {
  static async analyzeAndSave(
    userId: string,
    transcript: string,
    applicationId?: string
  ): Promise<IntakeAnalysisResult> {
    // Step 1: Extract structured business data via AI (with strict Zod validation)
    const { data: businessData, isMock } = await AIService.extractBusinessData(transcript);

    // Step 2: Ensure user exists
    const user = await User.findById(userId);
    if (!user) {
      throw AppError.notFound('User account not found');
    }

    let application: IApplication | null = null;

    if (applicationId) {
      if (!mongoose.Types.ObjectId.isValid(applicationId)) {
        throw AppError.badRequest('Invalid applicationId format');
      }

      application = await Application.findOne({
        _id: applicationId,
        userId: user._id,
      });

      if (!application) {
        throw AppError.notFound('Application not found or unauthorized access');
      }

      application.status = 'AI_PROCESSED';
      application.voiceIntake = {
        rawTranscript: transcript,
        detectedLanguage: businessData.language,
      };
      application.businessDetails = {
        ...application.businessDetails,
        stallType: businessData.kind_of_business,
        foodCategory: businessData.food_categories,
        businessName: application.businessDetails?.businessName || user.businessName || 'Street Food Stall',
      };

      await application.save();
    } else {
      // Create new application
      application = await Application.create({
        userId: user._id,
        status: 'AI_PROCESSED',
        voiceIntake: {
          rawTranscript: transcript,
          detectedLanguage: businessData.language,
        },
        businessDetails: {
          stallType: businessData.kind_of_business,
          foodCategory: businessData.food_categories,
          businessName: user.businessName || 'Street Food Stall',
          ownerName: user.name,
          phone: user.phone,
        },
      });
    }

    return {
      applicationId: application._id.toString(),
      business: businessData,
      isMock,
    };
  }
}