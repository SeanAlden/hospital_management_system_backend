const express = require('express')
const router = express.Router()

// Import controller
const patientController = require('../controllers/patient-controller')
const departmentController = require('../controllers/department-controller')
const doctorController = require('../controllers/doctor-controller')
const appointmentController = require("../controllers/appointment-controller")
const medicalRecordController = require('../controllers/medicalRecord-controller');
const roomController = require("../controllers/room-controller");
const admissionController = require("../controllers/admission-controller");
const billingController = require("../controllers/billing-controller");
const staffController = require("../controllers/staff-controller");
const labTestController = require("../controllers/labtest-controller");
const supplierController = require('../controllers/supplier-controller');
const medicineController = require("../controllers/medicine-controller");
const purchaseController = require("../controllers/purchaseController");
const medicineStockController = require("../controllers/medicineStockController");
const entryController = require("../controllers/entryController");
const exitController = require("../controllers/exitController");
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");

// ROUTES UNTUK PATIENT
router.post('/add_user', patientController.addPatient)
router.get('/patients', patientController.getAllPatients)
router.get('/get_patient/:id', patientController.getPatientById)
router.post('/edit_user/:id', patientController.editPatient)
router.delete('/delete/:id', patientController.deletePatient)

// ROUTES UNTUK DEPARTMENT
router.post('/add_department', departmentController.addDepartment)
router.get('/departments', departmentController.getAllDepartments)
router.get('/get_department/:id', departmentController.getDepartmentById)
router.post('/edit_department/:id', departmentController.editDepartment)
router.delete('/delete_department/:id', departmentController.deleteDepartment)

// ROUTES UNTUK DOCTOR
router.post('/add_doctor', doctorController.addDoctor);
router.get('/doctors', doctorController.getAllDoctors);
router.get('/get_doctor/:id', doctorController.getDoctorById);
router.post('/edit_doctor/:id', doctorController.editDoctor);
router.delete('/delete_doctor/:id', doctorController.deleteDoctor);

// ROUTES UNTUK APPOINTMENTS
router.post("/add_appointment", appointmentController.addAppointment);
router.get("/appointments", appointmentController.getAllAppointments);
router.get("/get_appointment/:id", appointmentController.getAppointmentById);
router.post("/edit_appointment/:id", appointmentController.editAppointment);
router.delete("/delete_appointment/:id", appointmentController.deleteAppointment);

// Medical Records
router.post('/add_medical_record', medicalRecordController.addMedicalRecord);
router.get('/medical_records', medicalRecordController.getAllMedicalRecords);
router.get('/get_medical_record/:id', medicalRecordController.getMedicalRecordById);
router.post('/edit_medical_record/:id', medicalRecordController.editMedicalRecord);
router.delete('/delete_medical_record/:id', medicalRecordController.deleteMedicalRecord);

// Routes Room
router.post("/add_room", roomController.addRoom);
router.get("/rooms", roomController.getAllRooms);
router.get("/get_room/:id", roomController.getRoomById);
router.post("/edit_room/:id", roomController.editRoom);
router.delete("/delete_room/:id", roomController.deleteRoom);

router.get("/admissions", admissionController.getAdmissions);
router.get("/admissions/:id", admissionController.getAdmissionById);
router.post("/admissions", admissionController.createAdmission);
router.put("/admissions/:id", admissionController.updateAdmission);
router.delete("/admissions/:id", admissionController.deleteAdmission);

router.get("/bills", billingController.getBills);
router.get("/bills/:id", billingController.getBillById);
router.post("/bills", billingController.createBill);
router.put("/bills/:id", billingController.updateBill);
router.delete("/bills/:id", billingController.deleteBill);

router.post("/staff", staffController.createStaff);
router.get("/staff", staffController.getAllStaff);
router.get("/staff/:id", staffController.getStaffById);
router.put("/staff/:id", staffController.updateStaff);
router.delete("/staff/:id", staffController.deleteStaff);

// LAB TEST ROUTES
router.get("/labtests", labTestController.getLabTests);
router.get("/labtests/:id", labTestController.getLabTestById);
router.post("/labtests", labTestController.createLabTest);
router.put("/labtests/:id", labTestController.updateLabTest);
router.delete("/labtests/:id", labTestController.deleteLabTest);

// SUPPLIER ROUTES
router.get('/suppliers/', supplierController.getSuppliers);
router.get('/suppliers/:id', supplierController.getSupplierById);
router.post('/suppliers/', supplierController.createSupplier);
router.put('/suppliers/:id', supplierController.updateSupplier);
router.delete('/suppliers/:id', supplierController.deleteSupplier);

router.get("/medicines", medicineController.getMedicines);
router.get("/medicines/:id", medicineController.getMedicineById);
router.post("/medicines", medicineController.createMedicine);
router.put("/medicines/:id", medicineController.updateMedicine);
router.delete("/medicines/:id", medicineController.deleteMedicine);

/* Purchases */
// router.post("/purchases", purchaseController.createPurchase);
// router.get("/purchases", purchaseController.getPurchases);
// router.get("/purchases/:id", purchaseController.getPurchaseById);

// Purchases
router.post("/purchases", purchaseController.createPurchase);
router.get("/purchases", purchaseController.getPurchases);
router.get("/purchases/:id", purchaseController.getPurchaseById);
router.put("/purchases/:id", purchaseController.updatePurchase);
router.delete("/purchases/:id", purchaseController.deletePurchase);

/* Stocks */
router.get("/medicine_stocks", medicineStockController.getStocks);
router.get("/medicine_stocks/:id", medicineStockController.getStockById);

/* Entry (move from purchase -> stock) */
// router.post("/entries", entryController.createEntry);
// router.get("/entries", (req, res) => { /* optional list entries */ });

router.post("/entries", entryController.createEntry);       // already present
router.get("/entries", entryController.listEntries);
router.get("/entries/:id", entryController.getEntryById);
router.put("/entries/:id", entryController.updateEntry);
router.delete("/entries/:id", entryController.deleteEntry);

// Exits (stock out)
router.post("/exits", exitController.createExit);
router.get("/exits", exitController.listExits);
router.get("/exits/:id", exitController.getExitById);
router.put("/exits/:id", exitController.updateExit);
router.delete("/exits/:id", exitController.deleteExit);

/* Exit (remove from stock) */
router.post("/exits", exitController.createExit);
router.get("/exits", (req, res) => { /* optional list exits */ });

// Auth
router.post("/auth/register", userController.register);
router.post("/auth/login", userController.login);
router.post("/auth/logout", userController.logout);
router.post("/users/profile", authMiddleware, userController.updateProfile);
router.post("/users/password", authMiddleware, userController.updatePassword);

// Protected info
router.get("/auth/me", authMiddleware, userController.me);

module.exports = router
