// export interface UploadedFile {
//   fileType?:string;
//   fileName: string;
//   fileUrl: string;
// }

// export interface ExcelData {
//   refID?:string;
//   docId?: string;
//   upfile?:UploadedFile[];
//   createdBy?:any;
//   createdOn?:Date;
//   caseComplaintDate: Date;
//   caseNumber: string;
//   caseName: string; // Case Name
//   techCategory?: string; // Technology
//   courtNames?: string; // Court Names
//   quickSearchReport: number; // Quick search report
//   status?: string; // Case Status
//   litigationVenues?: string; // Litigation Venues & Judicial Authorities
//   relatedOriginatingCases?: string; // Related/Originating Cases
//   caseClosedDate?: Date; // Case Closed Date
//   patentNo?: string; // Patent Number
//   industry: string; // Industry
//   technologyKeywords: string; // Technology Keywords
//   techCentre?: string; // Technology Centre
//   accusedProduct?: string; // Accused Product
//   chancesOfWinning?: string; // Chances of Winning
//   patentIssuedDate?: Date; // Patent Issued Date
//   patentExpiryDate?: Date; // Patent Expiry Date
//   acquiredPatentOrOrganicPatent?: string; // Acquired Patent or Organic Patent?
//   activityTimeline?: string; // Activity Timeline
//   numberOfInfringedClaims?: number; // Number of Infringed Claims
//   numberOfDefendants?: number; // Number of Defendants
//   otherDefendants?: string; // Other Defendants
//   thirdPartyFundingInvolved?: string; // Third-party Funding Involved
//   typeOfInfringement?: string; // Type of Infringement
//   caseStrengthLevel?: string; // Case Strength Level
//   singlePatentOrFamilyInvolved?: string; // Single Patent or Family Involved?
//   backwardCitation?: string; // Backward Citation
//   forwardCitation?: string; // Forward Citation
//   judge?: string; // Judge
//   typeOfPatent?: string; // Type of Patent
//   plaintiffTypeAndSize?: string; // Plaintiff Type & Size
//   defendantTypeAndSize?: string; // Defendant Type & Size
//   originalAssignee?: string; // Original Assignee
//   currentAssignee?: string; // Current Assignee
//   assigneeTimeline?: string; // Assignee Timeline
//   recentAction?: string; // Recent Action
//   winningAmount?: string; // Winning Amount
//   winningParty?: string; // Winning Party
//   otherPossibleInfringer?: string; // Other Possible Infringer
//   listOfPriorArt?: string; // List of Prior Art
//   standardEssentialPatent?: string; // Standard Essential Patent
//   semiconductorPatent?: string; // Semiconductor Patent
//   causeOfAction?: string; // Cause of Action
//   artUnit?: string; // Art Unit
//   reasonOfAllowance?: string; // Reason of Allowance
//   plaintiffOrPetitioner?: string; // Plaintiff/Petitioner
//   plaintiffsCompanyName?: string; // Plaintiff's Company's Name
//   plaintiffsName?: string; // plaintiffs Attorney
//   plaintiffsPhone?: string; // plaintiffs Phone
//   plaintiffsEmail?: string; // plaintiffs Email
//   defendant?: string; // Defendant
//   defendantLawFirmName?: string; // Defendant Law Firm Name
//   defendantAttorney?: string; // Defendant Attorney
//   defendantPhone?: string; // Defendant Phone
//   defendantEmail?: string; // Defendant Email
//   assignedJudge?: string; // Assigned Judge
//   stage?: string; // Stage
//   }

export interface UploadedFile {
  fileType?: string;
  fileName: string;
  fileUrl: string;
}

export interface ContactPerson {
  name?: string;
  phone?: string;
  email?: string;
}

export interface CaseDetails {
  caseComplaintDate: Date; // Case Complaint Date
  caseNumber: string; // Case Number
  caseName: string; // Case Name
  status?: string; // Case Status
  litigationVenues?: string; // Litigation Venues & Judicial Authorities
  courtNames: string;
  relatedOriginatingCases?: string; // Related/Originating Cases
  caseClosedDate?: Date; // Case Closed Date
}

export interface PatentDetails {
  patentNo?: string; // Patent Number
  techCategory?: string; // Technology Category
  technologyKeywords: string; // Technology Keywords
  techCentre?: string; // Technology Centre
  patentIssuedDate?: Date; // Patent Issued Date
  patentExpiryDate?: Date; // Patent Expiry Date
  acquiredPatentOrOrganicPatent?: string; // Acquired Patent or Organic Patent
  originalAssignee?: string; // Original Assignee
  currentAssignee?: string; // Current Assignee
  assigneeTimeline?: string; // Assignee Timeline
}

export interface InfringementDetails {
  accusedProduct?: string; // Accused Product
  chancesOfWinning?: string; // Chances of Winning
  typeOfInfringement?: string; // Type of Infringement
  caseStrengthLevel?: string; // Case Strength Level
  numberOfInfringedClaims?: number; // Number of Infringed Claims
  numberOfDefendants?: number; // Number of Defendants
  otherDefendants?: string; // Other Defendants
  thirdPartyFundingInvolved?: string; // Third-party Funding Involved
  singlePatentOrFamilyInvolved?: string; // Single Patent or Family Involved
}

export interface CitationDetails {
  backwardCitation?: string; // Backward Citation
  forwardCitation?: string; // Forward Citation
}

export interface LegalEntities {
  plaintiffPersons?: ContactPerson[]; // Array of plaintiff's contact persons
  defendantPersons?: ContactPerson[]; // Array of defendant's contact persons
  plaintiffOrPetitioner: string;
  plaintiffsLawFirmName?: string; // Plaintiff's Company Name
  defendant?: string; // Defendant
  defendantLawFirmName?: string; // Defendant Law Firm Name
}

export interface CaseOutcome {
  recentAction?: string; // Recent Action
  winningAmount?: string; // Winning Amount
  winningParty?: string; // Winning Party
  otherPossibleInfringer?: string; // Other Possible Infringer
  listOfPriorArt?: string; // List of Prior Art
}

export interface AdministrativeDetails {
  judge?: string; // Judge
  assignedJudge?: string; // Assigned Judge
  typeOfPatent?: string; // Type of Patent
  plaintiffTypeAndSize?: string; // Plaintiff Type & Size
  defendantTypeAndSize?: string; // Defendant Type & Size
  stage?: string; // Case Stage
}

export interface ExcelData {
  refID?: string;
  docId?: string;
  upfile?: UploadedFile[];
  createdBy?: any;
  createdOn?: Date;
  caseDetails: CaseDetails; // Basic case details
  patentDetails: PatentDetails; // Patent-related details
  infringementDetails?: InfringementDetails; // Infringement-related details
  citationDetails?: CitationDetails; // Backward and forward citations
  legalEntities: LegalEntities; // Plaintiff and defendant information
  caseOutcome?: CaseOutcome; // Outcome or progress details
  administrativeDetails?: AdministrativeDetails; // Administrative case details
  industry: string; // Industry
  activityTimeline?: string; // Activity Timeline
  standardEssentialPatent?: string; // Standard Essential Patent
  semiconductorPatent?: string; // Semiconductor Patent
  causeOfAction?: string; // Cause of Action
  artUnit?: string; // Art Unit
  reasonOfAllowance?: string; // Reason of Allowance
  quickSearchReport?: string[]; // Array of URLs (PDFs or Excel files)
}
